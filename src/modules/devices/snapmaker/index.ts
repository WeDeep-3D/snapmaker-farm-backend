import { HttpApi } from '@/api/snapmaker'
import { KlippyState } from '@/api/snapmaker/types'
import type { devices } from '@/database/schema'
import { log } from '@/log'

import { PrintState } from './types'

export class SnapmakerDevice {
  private _klippyState: KlippyState = KlippyState.unknown
  private _printState: PrintState = PrintState.unknown
  private _httpApi: HttpApi
  private _ws: WebSocket

  constructor(ip: string, device: typeof devices.$inferSelect) {
    this._httpApi = new HttpApi(ip)
    this._ws = new WebSocket(`ws://${ip}:7125/websocket`)
    this._ws.onclose = (event) => {
      log.warn(
        { device, event },
        `Ws closed on ${device.model} (${device.serialNumber})`,
      )
      this._klippyState = KlippyState.unknown
      this._printState = PrintState.unknown
    }
    this._ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      switch (data.method) {
        case 'notify_devie_info_update': {
          log.info(
            { device, data },
            `Device info updated on ${device.model} (${device.serialNumber})`,
          )
          return
        }
        case 'notify_klippy_state': {
          this._klippyState = data.params.state as KlippyState
          break
        }
        case 'notify_print_state': {
          this._printState = data.params.state as PrintState
          break
        }
        default:
          log.debug(
            { device, data },
            `Ws message on ${device.model} (${device.serialNumber})`,
          )
          return
      }
    }
  }

  get klippyState() {
    return this._klippyState
  }

  get printState() {
    return this._printState
  }
}
