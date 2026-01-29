import { Elysia } from 'elysia'
import { isIP } from 'node:net'

import { db } from '@/database'
import { devices } from '@/database/schema'
import { log } from '@/log'
import { checkIsMoonrakerDevice } from '@/utils/api'

import { SnapmakerDevice } from './snapmaker'

export abstract class Device {}

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
        if (!ip || !isIP(ip) || !(await checkIsMoonrakerDevice(ip))) {
          store.disconnectedDevices.set(device.id, device)
          return
        }
        if (!(await checkIsMoonrakerDevice(ip))) {
          store.unknownDevices.set(device.id, new SnapmakerDevice(ip, device))
          return
        }
        store.connectedDevices.set(device.id, new SnapmakerDevice(ip, device))
      }),
    )
    log.info(
      { failedConnections: results.filter((r) => r.status === 'rejected') },
      'Device connections on startup completed',
    )
  })
