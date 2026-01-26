import { t } from 'elysia'
import { CommonModel } from '@/utils/model'

export namespace ScansModel {
  import buildSuccessRespBody = CommonModel.buildSuccessRespBody
  export const createScanReqBody = t.Array(
    t.Union([
      t.Object({
        begin: t.String({ format: 'ipv4' }),
        end: t.String({ format: 'ipv4' }),
      }),
      t.Object({
        cidr: t.String({
          pattern:
            '(([1-9]{0,1}[0-9]{0,2}|2[0-4][0-9]|25[0-5])\\.){3}([1-9]{0,1}[0-9]{0,2}|2[0-4][0-9]|25[0-5])\\/([1-2][0-9]|3[0-1])',
        }),
      }),
    ]),
  )
  export const createScanRespBody = buildSuccessRespBody(
    t.String({ format: 'uuid' }),
  )
  export const getAllScansRespBody = buildSuccessRespBody(
    t.Object({
      concurrency: t.Number(),
      timeout: t.Number(),
      workers: t.Object({
        waiting: t.Number(),
        running: t.Number(),
      }),
      tasks: t.Array(
        t.Object({
          id: t.String({ format: 'uuid' }),
          queuedCount: t.Number(),
          recognizedCount: t.Number(),
          totalCount: t.Number(),
        }),
      ),
    }),
  )
  export const getScanRespBody = buildSuccessRespBody(
    t.Object({
      queuedCount: t.Number(),
      recognized: t.Array(t.String({ format: 'ipv4' })),
      totalCount: t.Number(),
    }),
  )
  export const updateScanReqBody = t.Object({
    concurrency: t.Optional(t.Number({ minimum: 1, maximum: 1000 })),
    timeout: t.Optional(t.Number({ minimum: 100, maximum: 60000 })),
  })
  export const updateScanRespBody = buildSuccessRespBody(
    t.Object({
      concurrency: t.Number(),
      timeout: t.Number(),
    }),
  )
  export const deleteAllScansRespBody = buildSuccessRespBody(
    t.Number(),
  )
  export const deleteScanRespBody = buildSuccessRespBody()
}
