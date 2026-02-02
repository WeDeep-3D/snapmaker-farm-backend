import { createInsertSchema, createSelectSchema } from 'drizzle-typebox'
import { Elysia, t } from 'elysia'

import { projects } from '@/database/schema'
import { buildSuccessRespBody, errorRespBody } from '@/utils/model'

const projectSelectSchema = createSelectSchema(projects)
const projectInsertSchema = createInsertSchema(projects)

const projectChangeableSchema = t.Omit(projectInsertSchema, ['id', 'createdAt', 'updatedAt'])
const projectEditableSchema = t.Omit(projectChangeableSchema, [])

export const projectsModel = new Elysia({ name: 'projects.model' }).model({
  fullSingleProjectRespBody: buildSuccessRespBody(projectSelectSchema),
  fullMultipleProjectsRespBody: buildSuccessRespBody(t.Array(projectSelectSchema)),
  createProjectReqBody: projectChangeableSchema,
  updateProjectReqBody: t.Partial(projectEditableSchema),
  errorRespBody,
})

export type CreateProjectReqBody = typeof projectsModel.models.createProjectReqBody.schema.static
export type UpdateProjectReqBody = typeof projectsModel.models.updateProjectReqBody.schema.static
