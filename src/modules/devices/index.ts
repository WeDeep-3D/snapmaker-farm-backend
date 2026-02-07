import axios from 'axios'
import { Elysia } from 'elysia'

import { buildErrorResponse, buildSuccessResponse } from '@/utils/common'
import { packToZipStream } from '@/utils/io'

import { devicesModel } from './model'
import { Devices, devicesService } from './service'
import { SnapmakerDevice } from './snapmaker'

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
  .post(
    '/',
    async ({ body, store }) => {
      try {
        const results = await Promise.all(body.map((item) => Devices.bindDevice(item)))

        // Update in-memory store for successfully bound devices
        for (const result of results) {
          if (result.status === 'bound' && result.device) {
            const device = result.device
            store.disconnectedDevices.delete(device.id)
            store.unknownDevices.delete(device.id)
            store.connectedDevices.set(device.id, new SnapmakerDevice(result.ip, device))
          }
        }

        return buildSuccessResponse(results)
      } catch (error) {
        return buildErrorResponse(500, (error as Error).message)
      }
    },
    {
      body: 'bindDevicesReqBody',
      response: {
        200: 'bindDevicesRespBody',
        500: 'errorRespBody',
      },
    },
  )
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
