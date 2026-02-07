import axios, { type AxiosInstance } from 'axios'

import type { GetMoonrakerInfoResp, GetSystemInfoResp, ListRegisteredRootsResp } from './types'

export class HttpApi {
  private readonly _api: AxiosInstance

  constructor(ip: string) {
    // noinspection HttpUrlsUsage
    this._api = axios.create({ adapter: 'fetch', baseURL: `http://${ip}:7125` })
  }

  async getMoonrakerInfo() {
    return (await this._api.get<GetMoonrakerInfoResp>('/server/info')).data
  }

  async getSystemInfo(): Promise<GetSystemInfoResp> {
    return (await this._api.get<GetSystemInfoResp>('/machine/system_info')).data
  }

  async listAvailableFiles(root: string) {
    return (
      await this._api.get<ListRegisteredRootsResp>('/server/files/list', {
        params: { root },
      })
    ).data
  }

  async listRegisteredRoots() {
    return (await this._api.get<ListRegisteredRootsResp>('/server/files/roots')).data
  }

  async downloadFile(root: string, filename: string): Promise<string> {
    const response = await this._api.get<string>(`/server/files/${root}/${filename}`, {
      responseType: 'text',
    })
    return response.data
  }

  async uploadFile(root: string, filename: string, content: string): Promise<void> {
    const formData = new FormData()
    const blob = new Blob([content], { type: 'text/plain' })
    formData.append('file', blob, filename)
    formData.append('root', root)
    await this._api.post('/server/files/upload', formData)
  }
}
