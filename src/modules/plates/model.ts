import { createInsertSchema, createSelectSchema } from 'drizzle-typebox'
import { Elysia, t } from 'elysia'

import { plates } from '@/database/schema'
import { buildSuccessRespBody, errorRespBody } from '@/utils/model'

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

export const platesModel = new Elysia({ name: 'plates.model' }).model({
  fullSinglePlateRespBody: buildSuccessRespBody(plateSelectSchema),
  createPlateReqBody: plateChangeableSchema,
  updatePlateReqBody: t.Partial(plateEditableSchema),
  errorRespBody,
})

export type CreatePlateReqBody =
  typeof platesModel.models.createPlateReqBody.schema.static
export type UpdatePlateReqBody =
  typeof platesModel.models.updatePlateReqBody.schema.static
