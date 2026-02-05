import axios from 'axios'
import { Elysia } from 'elysia'

import { devicesModel } from './model'
import { devicesService } from './service'
import { packToZip } from '@/utils/io'
import { buildErrorResponse } from '@/utils/common'

export const devices = new Elysia({
  prefix: '/api/v1/devices',
  tags: ['Devices'],
})
  .use(devicesModel)
  .use(devicesService)
  .get('/', ({ store }) => ({
    devices: {
      connected: store.connectedDevices,
      disconnected: store.disconnectedDevices,
      unknown: store.unknownDevices,
    },
  }))
  .get('/:ip/logs', async ({ params }) => {
    // noinspection HttpUrlsUsage
    const filesApi = axios.create({
      baseURL: `http://${params.ip}:7125/server/files`,
    })
    try {
      const fileList = await Promise.all(
        (
          await filesApi.get<{
            result: { path: string; modified: number; size: number; permissions: string }[]
          }>(`/list?root=logs`)
        ).data.result.map(async (fileData) => {
          try {
            return new File(
              [
                new Blob([(await filesApi.get<ArrayBuffer>(`/logs/${fileData.path}`)).data], {
                  type: 'application/octet-stream',
                }),
              ],
              fileData.path,
              {
                lastModified: fileData.modified,
                type: 'application/octet-stream',
              },
            )
          } catch (error) {
            return new File(
              [new Blob([(error as Error).message], { type: 'text/plain' })],
              fileData.path,
              {
                lastModified: fileData.modified,
                type: 'application/octet-stream',
              },
            )
          }
        }),
      )
      const blob = await packToZip(fileList)
      return new File([blob], `${params.ip}_logs.zip`, { type: 'application/zip' })
    } catch (error) {
      return buildErrorResponse(500, (error as Error).message)
    }
  })
