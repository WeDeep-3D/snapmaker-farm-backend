import { AxiosError } from 'axios'
import { sql } from 'drizzle-orm'
import { Elysia } from 'elysia'
import { isIP } from 'node:net'

import packageJson from 'package.json'
import { HttpApi } from '@/api/snapmaker'
import type { GetSystemInfoResp } from '@/api/snapmaker/types'
import { db } from '@/database'
import { devices, farmMetadata } from '@/database/schema'
import { log } from '@/log'
import { checkTcpPortOpen } from '@/utils/net'

import { SnapmakerDevice } from './snapmaker'
import type { BindDeviceItem, BindDeviceResult } from './model'

const BINDING_FILENAME = `.${packageJson.name}_binding`

let cachedFarmId: string

export async function getDbFingerprint(): Promise<string> {
  if (cachedFarmId) {
    return cachedFarmId
  }

  const existing = await db.select().from(farmMetadata).limit(1)
  if (existing[0]) {
    cachedFarmId = existing[0].id
    return cachedFarmId
  }

  const inserted = (await db.insert(farmMetadata).values({}).returning())[0]
  if (!inserted) {
    throw new Error('Failed to initialize farm metadata')
  }
  cachedFarmId = inserted.id
  return cachedFarmId
}

function extractNetworkInfo(network: GetSystemInfoResp['result']['system_info']['network']) {
  let ethIp: string | undefined = undefined
  let ethMac: string | undefined = undefined
  let wlanIp: string | undefined = undefined
  let wlanMac: string | undefined = undefined

  for (const [name, info] of Object.entries(network)) {
    const ipAddress = info.ip_addresses.find((a) => a.family === 'ipv4' && !a.is_link_local)

    if (!ethMac && /^(eth|en)/.test(name)) {
      ethMac = info.mac_address
      if (ipAddress) {
        ethIp = ipAddress.address
      }
    } else if (!wlanMac && /^(wlan|wl)/.test(name)) {
      wlanMac = info.mac_address
      if (ipAddress) {
        wlanIp = ipAddress.address
      }
    }
  }

  return { ethIp, ethMac, wlanIp, wlanMac }
}

export abstract class Devices {
  static async bindDevice(bindDeviceItem: BindDeviceItem): Promise<BindDeviceResult> {
    const api = new HttpApi(bindDeviceItem.ip)
    const fingerprint = await getDbFingerprint()

    // Step 1: Check binding file on device's config root
    let needsUpload = true
    try {
      const existingBinding = await api.downloadFile('config', BINDING_FILENAME)
      const existingFingerprint = existingBinding.trim()

      if (existingFingerprint === fingerprint) {
        // Already bound by us, skip upload but still ensure device is in DB
        needsUpload = false
      } else if (!bindDeviceItem.force) {
        return {
          ip: bindDeviceItem.ip,
          status: 'already_bound',
          message: `Device is already bound to another backend (fingerprint: ${existingFingerprint})`,
        }
      }
      // force=true with different fingerprint → will overwrite below
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 404) {
        // File doesn't exist, will create it below
      } else {
        return {
          ip: bindDeviceItem.ip,
          status: 'error',
          message: `Failed to check binding file: ${(error as Error).message}`,
        }
      }
    }

    // Step 2: Upload/overwrite binding file if needed
    if (needsUpload) {
      try {
        await api.uploadFile('config', BINDING_FILENAME, fingerprint)
      } catch (error) {
        return {
          ip: bindDeviceItem.ip,
          status: 'error',
          message: `Failed to upload binding file: ${(error as Error).message}`,
        }
      }
    }

    // Step 3: Get system info
    let systemInfo: GetSystemInfoResp
    try {
      systemInfo = await api.getSystemInfo()
    } catch (error) {
      return {
        ip: bindDeviceItem.ip,
        status: 'error',
        message: `Failed to get system info: ${(error as Error).message}`,
      }
    }

    // Step 4: Extract device info and upsert into DB
    const { product_info, network } = systemInfo.result.system_info
    const networkInfo = extractNetworkInfo(network)
    const model = 'Snapmaker:U1' as const

    try {
      const upsertedDevice = (
        await db
          .insert(devices)
          .values({
            model,
            serialNumber: product_info.serial_number,
            description: `${product_info.device_name} (FW: ${product_info.firmware_version})`,
            ethIp: networkInfo.ethIp,
            ethMac: networkInfo.ethMac,
            wlanIp: networkInfo.wlanIp,
            wlanMac: networkInfo.wlanMac,
          })
          .onConflictDoUpdate({
            target: [devices.model, devices.serialNumber],
            set: {
              description: `${product_info.device_name} (FW: ${product_info.firmware_version})`,
              ethIp: networkInfo.ethIp,
              ethMac: networkInfo.ethMac,
              wlanIp: networkInfo.wlanIp,
              wlanMac: networkInfo.wlanMac,
              updatedAt: sql`now()`,
            },
          })
          .returning()
      )[0]

      if (!upsertedDevice) {
        return {
          ip: bindDeviceItem.ip,
          status: 'error',
          message: 'Failed to upsert device in database',
        }
      }

      return {
        ip: bindDeviceItem.ip,
        status: 'bound',
        device: upsertedDevice,
      }
    } catch (error) {
      log.error(error, 'Database error while binding device')
      return {
        ip: bindDeviceItem.ip,
        status: 'error',
        message: `Database error: ${(error as Error).message}`,
      }
    }
  }
}

export const devicesService = new Elysia({ name: 'devices.service' })
  .state({
    connectedDevices: new Map<string, SnapmakerDevice>(),
    disconnectedDevices: new Map<string, typeof devices.$inferSelect>(),
    unknownDevices: new Map<string, SnapmakerDevice>(),
  })
  .onStart(async ({ store }) => {
    const allDevices = await db.select().from(devices)
    log.debug({ allDevices }, 'Try connecting to all devices on startup')
    const results = await Promise.allSettled(
      allDevices.map(async (device) => {
        const ip = device.ethIp ?? device.wlanIp
        if (!ip || !isIP(ip) || !(await checkTcpPortOpen(ip, 7125, 2000))) {
          store.disconnectedDevices.set(device.id, device)
          return
        }
        try {
          if ((await new HttpApi(ip).getMoonrakerInfo()).result?.moonraker_version.length) {
            store.connectedDevices.set(device.id, new SnapmakerDevice(ip, device))
          } else {
            store.unknownDevices.set(device.id, new SnapmakerDevice(ip, device))
          }
        } catch {
          store.unknownDevices.set(device.id, new SnapmakerDevice(ip, device))
        }
      }),
    )
    log.info(
      { failedConnections: results.filter((r) => r.status === 'rejected') },
      'Device connections on startup completed',
    )
  })
