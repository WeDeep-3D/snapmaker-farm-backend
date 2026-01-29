import { Elysia } from 'elysia'

import { buildErrorResponse } from '@/utils/common'

import { projectsModel } from './model'
import { Project, projectsService } from './service'

export const projects = new Elysia({
  prefix: '/api/v1/projects',
  tags: ['Project'],
})
  .use(projectsModel)
  .use(projectsService)
  .post(
    '/',
    async ({ body }) => {
      try {
        return await Project.createProject(body)
      } catch (error) {
        return buildErrorResponse(500, (error as Error).message)
      }
    },
    {
      body: 'createProjectReqBody',
      response: {
        200: 'fullSingleProjectRespBody',
        500: 'errorRespBody',
      },
    },
  )
  .get(
    '/',
    async () => {
      try {
        return await Project.getAllProjects()
      } catch (error) {
        return buildErrorResponse(500, (error as Error).message)
      }
    },
    {
      response: {
        200: 'fullMultipleProjectsRespBody',
        500: 'errorRespBody',
      },
    },
  )
  .get(
    '/:projectId',
    async ({ params }) => {
      try {
        return await Project.getProject(params.projectId)
      } catch (error) {
        return buildErrorResponse(500, (error as Error).message)
      }
    },
    {
      response: {
        200: 'fullSingleProjectRespBody',
        404: 'errorRespBody',
        500: 'errorRespBody',
      },
    },
  )
  .patch(
    '/:projectId',
    async ({ body, params }) => {
      try {
        return await Project.updateProject(params.projectId, body)
      } catch (error) {
        return buildErrorResponse(500, (error as Error).message)
      }
    },
    {
      body: 'updateProjectReqBody',
      response: {
        200: 'fullSingleProjectRespBody',
        404: 'errorRespBody',
        500: 'errorRespBody',
      },
    },
  )
  .delete(
    '/:projectId',
    async ({ params }) => {
      try {
        return await Project.deleteProject(params.projectId)
      } catch (error) {
        return buildErrorResponse(500, (error as Error).message)
      }
    },
    {
      response: {
        200: 'fullSingleProjectRespBody',
        404: 'errorRespBody',
        500: 'errorRespBody',
      },
    },
  )
