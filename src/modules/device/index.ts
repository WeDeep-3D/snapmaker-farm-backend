import { Elysia } from 'elysia'
import { IPv4 } from 'ip-num'

import { DeviceModel } from './model'
import { Device, deviceService } from './service'

export const device = new Elysia({ prefix: '/api/v1/device' })
  .use(deviceService)
  .get('/', ({ store }) => ({
    devices: {
      connected: store.connectedDevices,
      disconnected: store.disconnectedDevices,
      unknown: store.unknownDevices,
    },
  }))
  .post(
    '/scan',
    async function* ({ body: { begin, end } }) {
      const MAX_RANGE = 65536n

      const beginIpNumber = IPv4.fromString(begin).value
      const endIpNumber = IPv4.fromString(end).value

      if (endIpNumber < beginIpNumber) {
        throw new Error('End IP must be greater than or equal to Begin IP')
      }
      if (endIpNumber - beginIpNumber >= MAX_RANGE) {
        throw new Error(
          `Scan range too large. Max supported addresses: ${MAX_RANGE.toString()}`,
        )
      }

      for await (const progress of Device.scanDevices(
        beginIpNumber,
        endIpNumber,
      )) {
        yield progress
      }
    },
    {
      body: DeviceModel.scanReqBody,
    },
  )
