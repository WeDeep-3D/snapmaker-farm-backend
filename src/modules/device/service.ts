import { Elysia } from 'elysia'
import { isIP } from 'node:net'

import { db } from '@/database'
import { devices } from '@/database/schema'
import { log } from '@/log'

import { DeviceScanner, type ScanProgress } from './helper'
import { SnapmakerDevice } from './snapmaker'
import { checkIsMoonrakerDevice, checkIsSnapmakerDevice } from './utils'

export abstract class Device {
  static async *scanDevices(
    beginIpNumber: bigint,
    endIpNumber: bigint,
  ): AsyncGenerator<ScanProgress> {
    const scanner = new DeviceScanner(beginIpNumber, endIpNumber)
    for await (const progress of scanner.scan()) {
      yield progress
    }
  }
}

export const deviceService = new Elysia({ name: 'device.service' })
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
        if (!(await checkIsSnapmakerDevice(ip))) {
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
