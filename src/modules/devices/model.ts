import { createSelectSchema } from 'drizzle-typebox'
import { Elysia, t } from 'elysia'

import { devices } from '@/database/schema'
import { buildSuccessRespBody, errorRespBody } from '@/utils/model'

const deviceSelectSchema = createSelectSchema(devices)

const bindDeviceItem = t.Object({
  ip: t.String({ format: 'ipv4' }),
  force: t.Optional(t.Boolean({ default: false })),
})
export type BindDeviceItem = typeof bindDeviceItem.static

const bindDeviceResult = t.Object({
  ip: t.String({ format: 'ipv4' }),
  status: t.Union([t.Literal('bound'), t.Literal('already_bound'), t.Literal('error')]),
  device: t.Optional(deviceSelectSchema),
  message: t.Optional(t.String()),
})
export type BindDeviceResult = typeof bindDeviceResult.static

export const devicesModel = new Elysia({ name: 'devices.model' }).model({
  getAllDevicesRespBody: buildSuccessRespBody(
    t.Array(
      t.Object({
        id: t.String({ format: 'uuid' }),
        name: t.String(),
        ipAddress: t.String({ format: 'ipv4' }),
        status: t.Union([t.Literal('online'), t.Literal('offline')]),
        lastSeen: t.String({ format: 'date-time' }),
      }),
    ),
  ),
  bindDevicesReqBody: t.Array(bindDeviceItem),
  bindDevicesRespBody: buildSuccessRespBody(t.Array(bindDeviceResult)),
  errorRespBody,
})
