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

class AsyncResultQueue<T> implements AsyncIterable<T> {
  private queue: T[] = []
  private pending: ((value: IteratorResult<T>) => void)[] = []
  private finished = false

  push(value: T) {
    if (this.finished) return
    if (this.pending.length) {
      this.pending.shift()?.({ value, done: false })
      return
    }
    this.queue.push(value)
  }

  end() {
    this.finished = true
    while (this.pending.length) {
      this.pending.shift()?.({ value: undefined as never, done: true })
    }
  }

  [Symbol.asyncIterator](): AsyncIterator<T> {
    return {
      next: () => this.next(),
    }
  }

  private next(): Promise<IteratorResult<T>> {
    if (this.queue.length) {
      const value = this.queue.shift() as T
      return Promise.resolve({ value, done: false })
    }
    if (this.finished) {
      return Promise.resolve({ value: undefined as never, done: true })
    }
    return new Promise<IteratorResult<T>>((resolve) => this.pending.push(resolve))
  }
}

export abstract class Device {
  static scanDevices(
    beginIpNumber: bigint,
    endIpNumber: bigint,
  ): AsyncIterable<ScanProgress> {
    const CONCURRENCY = 200

    const ipsToCheck = generateIpsToCheck(beginIpNumber, endIpNumber)

    const queue = new AsyncResultQueue<ScanProgress>()

    if (!ipsToCheck.length) {
      queue.push({
        done: true,
        data: [],
        processed: 0,
        total: 0,
      })
      queue.end()
      return queue
    }

    const results: string[] = []
    const totalCount = ipsToCheck.length
    const workerCount = Math.min(CONCURRENCY, totalCount)

    let processed = 0
    log.debug(
      {
        totalIps: endIpNumber - beginIpNumber,
        queued: totalCount,
        workerCount,
      },
      'Start scanning devices',
    )

    ;(async () => {
      try {
        const worker = async (id: number) => {
          while (ipsToCheck.length) {
            const ip = ipsToCheck.pop()
            if (!ip) {
              break
            }
            if (await checkIsMoonrakerDevice(ip)) {
              results.push(ip)
              queue.push({
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

        queue.push({
          done: true,
          data: [...results],
          processed: totalCount,
          total: totalCount,
        })
      } catch (error) {
        queue.push({
          done: true,
          data: [...results],
          processed,
          total: totalCount,
        })
        log.error({ error }, 'Scan failed')
      } finally {
        queue.end()
      }
    })()

    return queue
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
