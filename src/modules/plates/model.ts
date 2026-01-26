import { createInsertSchema, createSelectSchema } from 'drizzle-typebox'
import { t } from 'elysia'

import { plates } from '@/database/schema'
import { CommonModel } from '@/utils/model'

const plateInsertSchema = createInsertSchema(plates)
const plateSelectSchema = createSelectSchema(plates)

const plateChangeableSchema = t.Omit(plateInsertSchema, [
  'id',
  'createdAt',
  'updatedAt',
])
const plateEditableSchema = t.Omit(plateChangeableSchema, [
  'projectId',
  'completedCount',
  'failedCount',
  'totalCount',
  'deviceModel',
  'fileId',
])

export namespace PlatesModel {
  import buildSuccessRespBody = CommonModel.buildSuccessRespBody

  export const fullSinglePlateRespBody = buildSuccessRespBody(plateSelectSchema)

  export const createPlateReqBody = plateChangeableSchema
  export const updatePlateReqBody = t.Partial(plateEditableSchema)
}
