import axios from 'axios'
import { Elysia } from 'elysia'

import { devicesModel } from './model'
import { devicesService } from './service'
import { packToZipStream } from '@/utils/io'
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
    const baseURL = `http://${params.ip}:7125/server/files`
    const filesApi = axios.create({
      baseURL,
    })
    try {
      const { data } = await filesApi.get<{
        result: { path: string; modified: number; size: number; permissions: string }[]
      }>(`/list?root=logs`)

      const files = await Promise.all(
        data.result.map(async (fileData) => {
          const fileUrl = `${baseURL}/logs/${fileData.path}`
          const response = await fetch(fileUrl)
          if (!response.ok || !response.body) {
            throw new Error(`Failed to fetch log file ${fileData.path}: ${response.status}`)
          }

          return {
            name: fileData.path,
            lastModified: fileData.modified,
            type: response.headers.get('content-type') ?? 'application/octet-stream',
            input: response.body,
          }
        }),
      )

      const zipStream = packToZipStream(files)
      return new Response(zipStream, {
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename="${params.ip}_logs.zip"`,
          'Cache-Control': 'no-cache',
        },
      })
    } catch (error) {
      return buildErrorResponse(500, (error as Error).message)
    }
  })
