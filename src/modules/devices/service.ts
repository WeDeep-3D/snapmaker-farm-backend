import { Elysia } from 'elysia'
import { isIP } from 'node:net'

import { HttpApi } from '@/api/snapmaker'
import { db } from '@/database'
import { devices } from '@/database/schema'
import { log } from '@/log'
import { checkTcpPortOpen } from '@/utils/net'

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
