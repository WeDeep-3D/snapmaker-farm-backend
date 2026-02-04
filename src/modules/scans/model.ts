import { Elysia, t } from 'elysia'

import { buildSuccessRespBody, errorRespBody } from '@/utils/model'

const recognizedDeviceInfoModel = t.Object({
  model: t.String(),
  name: t.String(),
  network: t.Array(
    t.Object({
      ip: t.String({ format: 'ipv4' }),
      mac: t.String(),
      type: t.Union([t.Literal('wired'), t.Literal('wireless'), t.Literal('unknown')]),
    }),
  ),
  serialNumber: t.String(),
  version: t.String(),
})
export type RecognizedDeviceInfo = typeof recognizedDeviceInfoModel.static

const taskBaseModel = t.Object({
  id: t.String({ format: 'uuid' }),
  processingCount: t.Number(),
  totalCount: t.Number(),
})
export type TaskBase = typeof taskBaseModel.static

export const scansModel = new Elysia({ name: 'scans.model' }).model({
  createScanReqBody: t.Array(
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
  ),
  createScanRespBody: buildSuccessRespBody(t.String({ format: 'uuid' })),
  getAllScansRespBody: buildSuccessRespBody(
    t.Object({
      concurrency: t.Number(),
      timeout: t.Number(),
      workers: t.Object({
        waiting: t.Number(),
        running: t.Number(),
      }),
      tasks: t.Array(
        t.Intersect([
          taskBaseModel,
          t.Object({
            queuedCount: t.Number(),
            recognizedCount: t.Number(),
          }),
        ]),
      ),
    }),
  ),
  getScanRespBody: buildSuccessRespBody(
    t.Intersect([
      taskBaseModel,
      t.Object({
        queuedCount: t.Number(),
        recognized: t.Array(recognizedDeviceInfoModel),
      }),
    ]),
  ),
  updateScanReqBody: t.Object({
    concurrency: t.Optional(t.Number({ minimum: 1, maximum: 1000 })),
    timeout: t.Optional(t.Number({ minimum: 100, maximum: 60000 })),
  }),
  updateScanRespBody: buildSuccessRespBody(
    t.Object({
      concurrency: t.Number(),
      timeout: t.Number(),
    }),
  ),
  deleteAllScansRespBody: buildSuccessRespBody(t.Number()),
  deleteScanRespBody: buildSuccessRespBody(),
  errorRespBody,
})

export type CreateScanReqBody = typeof scansModel.models.createScanReqBody.schema.static
export type GetAllScansRespBody = typeof scansModel.models.getAllScansRespBody.schema.static
export type GetScanRespBody = typeof scansModel.models.getScanRespBody.schema.static
export type UpdateScanReqBody = typeof scansModel.models.updateScanReqBody.schema.static
