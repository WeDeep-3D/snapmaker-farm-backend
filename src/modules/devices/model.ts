import { Elysia, t } from 'elysia'

import { buildSuccessRespBody } from '@/utils/model'

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
})
