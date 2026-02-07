import { Elysia } from 'elysia'

import { buildErrorResponse } from '@/utils/common'

import { devicesModel } from './model'
import { Devices, devicesService } from './service'

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
        return await Devices.bindDevices(body, store)
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
    try {
      return await Devices.downloadLogs(params.ip)
    } catch (error) {
      return buildErrorResponse(500, (error as Error).message)
    }
  })
