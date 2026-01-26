import { t } from 'elysia'

import { buildSuccessResponse } from '@/utils/common'

export namespace DevicesModel {
  export const getAllDevicesRespBody = buildSuccessResponse(
    t.Array(
      t.Object({
        id: t.String({ format: 'uuid' }),
        name: t.String(),
        ipAddress: t.String({ format: 'ipv4' }),
        status: t.Union([t.Literal('online'), t.Literal('offline')]),
        lastSeen: t.String({ format: 'date-time' }),
      }),
    ),
  )
}
