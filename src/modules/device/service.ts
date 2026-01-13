import { Elysia } from 'elysia'
import { isIP } from 'node:net'

import { db } from '@/database'
import { devices } from '@/database/schema'
import { log } from '@/log'

import { SnapmakerHelper } from './snapmaker'
import {
  checkIsMoonrakerDevice,
  checkIsSnapmakerDevice,
  generateIpsToCheck,
} from './utils'

export type ScanProgress = {
  done: boolean
  data: string[]
  processed: number
  total: number
}

export abstract class Device {
  static async *scanDevices(
    beginIpNumber: bigint,
    endIpNumber: bigint,
  ): AsyncGenerator<ScanProgress> {
    const CONCURRENCY = 200

    const ipsToCheck = generateIpsToCheck(beginIpNumber, endIpNumber)

    if (!ipsToCheck.length) {
      yield {
        done: true,
        data: [],
        processed: 0,
        total: 0,
      }
      return
    }

    const results: string[] = []
    const totalCount = ipsToCheck.length
    const workerCount = Math.min(CONCURRENCY, totalCount)

    let processed = 0
    const updates: ScanProgress[] = []
    let notify: (() => void) | null = null
    let finished = false

    const pushUpdate = (update: ScanProgress) => {
      updates.push(update)
      if (notify) {
        notify()
        notify = null
      }
    }

    log.debug(
      {
        totalIps: endIpNumber - beginIpNumber,
        queued: totalCount,
        workerCount,
      },
      'Start scanning devices',
    )

    const runWorkers = (async () => {
      try {
        const worker = async (id: number) => {
          while (ipsToCheck.length) {
            const ip = ipsToCheck.pop()
            if (!ip) {
              break
            }
            if (await checkIsMoonrakerDevice(ip)) {
              results.push(ip)
              pushUpdate({
                done: false,
                data: [...results],
                processed,
                total: totalCount,
              })
            }
            const processedNow = ++processed
            if (processedNow % 50 === 0 || processedNow === totalCount) {
              log.debug(
                {
                  workerId: id,
                  processed: processedNow,
                  queued: totalCount,
                  found: results.length,
                },
                'Scan progress',
              )
            }
          }
        }

        await Promise.all(
          Array.from({ length: workerCount }, (_, idx) => worker(idx + 1)),
        )

        pushUpdate({
          done: true,
          data: [...results],
          processed: totalCount,
          total: totalCount,
        })
      } catch (error) {
        pushUpdate({
          done: true,
          data: [...results],
          processed,
          total: totalCount,
        })
        log.error({ error }, 'Scan failed')
      } finally {
        finished = true
      }
    })()

    while (true) {
      if (updates.length) {
        yield updates.shift() as ScanProgress
        continue
      }
      if (finished) {
        break
      }
      await new Promise<void>((resolve) => {
        notify = resolve
      })
    }

    await runWorkers
  }
}

export const deviceService = new Elysia({ name: 'device.service' })
  .state({
    connectedDevices: new Map<string, SnapmakerHelper>(),
    disconnectedDevices: new Map<string, typeof devices.$inferSelect>(),
    unknownDevices: new Map<string, SnapmakerHelper>(),
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
          store.unknownDevices.set(device.id, new SnapmakerHelper(ip, device))
          return
        }
        store.connectedDevices.set(device.id, new SnapmakerHelper(ip, device))
      }),
    )
    log.info(
      { failedConnections: results.filter((r) => r.status === 'rejected') },
      'Device connections on startup completed',
    )
  })
