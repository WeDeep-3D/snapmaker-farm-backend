import { Elysia } from 'elysia'

import { HttpApi } from '@/api/snapmaker'
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
    const api = new HttpApi(params.ip)
    try {
      const { result: fileList } = await api.listAvailableFiles('logs')

      const files = await Promise.all(
        fileList.map(async (fileData) => ({
          name: fileData.path,
          lastModified: fileData.modified,
          input: await api.downloadFile('logs', fileData.path),
        })),
      )

      return new Response(packToZipStream(files), {
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
