import { log } from '@/log'
import { generateSequence } from '@/utils/common'

import { checkIsMoonrakerDevice } from './utils'

interface Task {
  queued: string[]
  recognized: string[]
  totalCount: number
}

const normalizeConcurrency = (value: number): number => {
  return Math.max(0, Math.floor(value))
}

export class ScansHelper {
  private readonly _tasks = new Map<string, Task>()
  private readonly _runningWorker = new Set<string>()

  private _concurrency = 200
  private _lastTaskId: string | null = null
  private _isRunning = true
  private _timeout = 2000
  private _waitingPromises: Array<() => void> = []

  constructor() {
    for (const _ of generateSequence(0, this._concurrency)) {
      this._startWorker(Bun.randomUUIDv7()).catch((e) => log.error(e))
    }
  }

  create(queue: string[]) {
    if (!this._isRunning) {
      throw new Error('ScansHelper is not running')
    }

    const id = Bun.randomUUIDv7()
    this._tasks.set(id, {
      queued: queue,
      recognized: [],
      totalCount: queue.length,
    })
    this._notifyWorkers()
    return id
  }

  retrieve(taskId: string) {
    return this._tasks.get(taskId)
  }

  delete(taskId: string) {
    return this._tasks.delete(taskId)
  }

  deleteAll() {
    const taskCount = this._tasks.size
    this._tasks.clear()
    return taskCount
  }

  get configs() {
    return {
      concurrency: this._concurrency,
      timeout: this._timeout,
    }
  }

  get stats() {
    return {
      concurrency: this._concurrency,
      timeout: this._timeout,
      workers: {
        waiting: this._waitingPromises.length,
        running: this._runningWorker.size,
      },
      tasks: Array.from(this._tasks).map(([taskId, task]) => ({
        id: taskId,
        queuedCount: task.queued.length,
        recognizedCount: task.recognized.length,
        totalCount: task.totalCount,
      })),
    }
  }

  set concurrency(concurrency: number) {
    if (!this._isRunning) {
      return
    }

    const newConcurrency = normalizeConcurrency(concurrency)
    if (newConcurrency === this._concurrency) {
      return
    }

    if (newConcurrency > this._concurrency) {
      const diff = newConcurrency - this._concurrency
      for (const _ of generateSequence(0, diff)) {
        this._startWorker(Bun.randomUUIDv7()).catch((e) => log.error(e))
      }
    } else {
      const diff = this._concurrency - newConcurrency
      const tokens = Array.from(this._runningWorker).slice(0, diff)
      tokens.forEach((token) => this._runningWorker.delete(token))
      this._notifyWorkers()
    }

    this._concurrency = newConcurrency
  }

  set timeout(timeout: number) {
    if (!this._isRunning) {
      return
    }
    this._timeout = timeout
  }

  destroy() {
    this._isRunning = false
    this._concurrency = 0
    this._runningWorker.clear()
    this._notifyWorkers()
    this._tasks.clear()
    this._waitingPromises = []
    this._lastTaskId = null
  }

  private _notifyWorkers(): void {
    while (this._waitingPromises.length > 0) {
      this._waitingPromises.shift()?.()
    }
  }

  private _dequeueNext(): { taskId: string; ip: string } | null {
    const entries = Array.from(this._tasks.entries()).filter(
      ([_, task]) => task.queued.length > 0,
    )
    if (entries.length === 0) {
      this._lastTaskId = null
      return null
    }

    const lastIndex = this._lastTaskId
      ? entries.findIndex(([taskId]) => taskId === this._lastTaskId)
      : -1
    const startIndex = lastIndex >= 0 ? (lastIndex + 1) % entries.length : 0

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[(startIndex + i) % entries.length]
      if (!entry) {
        continue
      }
      const [taskId, task] = entry
      const ip = task.queued.shift()
      if (ip !== undefined) {
        this._lastTaskId = taskId
        return { taskId, ip }
      }
    }

    this._lastTaskId = null
    return null
  }

  private async _startWorker(workerId: string): Promise<void> {
    this._runningWorker.add(workerId)
    try {
      while (this._isRunning && this._runningWorker.has(workerId)) {
        const next = this._dequeueNext()
        if (!next) {
          await new Promise<void>((resolve) =>
            this._waitingPromises.push(resolve),
          )
          continue
        }
        const { taskId, ip } = next
        try {
          const isMoonrakerDevice = await checkIsMoonrakerDevice(
            ip,
            this._timeout,
          )
          const task = this._tasks.get(taskId)
          if (task && isMoonrakerDevice) {
            task.recognized.push(ip)
          }
        } catch (error) {
          log.error(error)
        }
      }
    } finally {
      this._runningWorker.delete(workerId)
    }
  }
}
