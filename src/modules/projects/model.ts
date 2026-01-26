import { createInsertSchema, createSelectSchema } from 'drizzle-typebox'
import { t } from 'elysia'

import { projects } from '@/database/schema'
import { CommonModel } from '@/utils/model'

const projectSelectSchema = createSelectSchema(projects)
const projectInsertSchema = createInsertSchema(projects)

const projectChangeableSchema = t.Omit(projectInsertSchema, [
  'id',
  'createdAt',
  'updatedAt',
])
const projectEditableSchema = t.Omit(projectChangeableSchema, [])

export namespace ProjectsModel {
  import buildSuccessRespBody = CommonModel.buildSuccessRespBody

  export const fullSingleProjectRespBody =
    buildSuccessRespBody(projectSelectSchema)
  export const fullMultipleProjectsRespBody = buildSuccessRespBody(
    t.Array(projectSelectSchema),
  )

  export const createProjectReqBody = projectChangeableSchema
  export const updateProjectReqBody = t.Partial(projectEditableSchema)
}
