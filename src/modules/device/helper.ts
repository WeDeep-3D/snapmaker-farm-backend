import { log } from '@/log'

import { checkIsMoonrakerDevice, generateIpsToCheck } from './utils'

export type ScanProgress = {
  done: boolean
  data: string[]
  processed: number
  total: number
}

const CONCURRENCY = 200

export class DeviceScanner {
  private readonly _ipsToCheck: string[]
  private readonly _results: string[] = []
  private _processed = 0
  private _nextIndex = 0

  private _updates: ScanProgress[] = []
  private _notify: (() => void) | null = null
  private _finished = false

  constructor(beginIpNumber: bigint, endIpNumber: bigint) {
    this._ipsToCheck = generateIpsToCheck(beginIpNumber, endIpNumber)
  }

  async *scan(): AsyncGenerator<ScanProgress> {
    if (!this._ipsToCheck.length) {
      yield { done: true, data: [], processed: 0, total: 0 }
      return
    }

    const workerPromise = this._runWorkers()

    while (true) {
      if (this._updates.length) {
        yield this._updates.shift() as ScanProgress
        continue
      }
      if (this._finished) {
        break
      }
      await new Promise<void>((resolve) => {
        this._notify = resolve
      })
    }

    await workerPromise
  }

  private _pushUpdate(update: ScanProgress) {
    this._updates.push(update)
    if (this._notify) {
      this._notify()
      this._notify = null
    }
  }

  private get _nextIp(): string | null {
    if (this._nextIndex >= this._ipsToCheck.length) {
      return null
    }
    return this._ipsToCheck[this._nextIndex++]
  }

  private async _runWorkers() {
    try {
      const workerCount = Math.min(CONCURRENCY, this._ipsToCheck.length)
      await Promise.all(
        Array.from({ length: workerCount }, () => this._runWorker()),
      )

      this._pushUpdate({
        done: true,
        data: [...this._results],
        processed: this._processed,
        total: this._ipsToCheck.length,
      })
    } catch (error) {
      this._pushUpdate({
        done: true,
        data: [...this._results],
        processed: this._processed,
        total: this._ipsToCheck.length,
      })
      log.error({ error }, 'Scan failed')
    } finally {
      this._finished = true
      if (this._notify) {
        this._notify()
        this._notify = null
      }
    }
  }

  private async _runWorker() {
    const checkInterval = Math.floor(this._ipsToCheck.length / 100) // Log at least every 1%
    while (true) {
      const ip = this._nextIp
      if (!ip) {
        return
      }

      const isMoonrakerDevice = await checkIsMoonrakerDevice(ip)
      this._processed++
      if (isMoonrakerDevice) {
        this._results.push(ip)
        this._pushUpdate({
          done: false,
          data: [...this._results],
          processed: this._processed,
          total: this._ipsToCheck.length,
        })
      }

      if (
        this._processed % checkInterval === 0 ||
        this._processed >= this._ipsToCheck.length
      ) {
        this._pushUpdate({
          done: false,
          data: [...this._results],
          processed: this._processed,
          total: this._ipsToCheck.length,
        })
      }
    }
  }
}
