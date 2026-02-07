import packageJson from 'package.json'
import type { GetSystemInfoResp } from '@/api/snapmaker/types'
import { db } from '@/database'
import { farmMetadata } from '@/database/schema'

export const BINDING_FILENAME = `.${packageJson.name}_binding`

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

export function extractNetworkInfo(
  network: GetSystemInfoResp['result']['system_info']['network'],
) {
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
