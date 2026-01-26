import { Elysia, status } from 'elysia'

import { Device, devicesService } from './service'

const MAX_RANGE = BigInt(65536)

export const devices = new Elysia({
  prefix: '/api/v1/devices',
  tags: ['Devices'],
})
  .use(devicesService)
  .get('/', ({ store }) => ({
    devices: {
      connected: store.connectedDevices,
      disconnected: store.disconnectedDevices,
      unknown: store.unknownDevices,
    },
  }))
