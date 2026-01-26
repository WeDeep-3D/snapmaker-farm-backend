import { Elysia } from 'elysia'

import { CommonModel } from '@/utils/model'

import { ProjectsModel } from './model'
import { Project, projectsService } from './service'
import { buildErrorResponse } from '@/utils/common'

export const projects = new Elysia({
  prefix: '/api/v1/projects',
  tags: ['Project'],
})
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
      body: ProjectsModel.createProjectReqBody,
      response: {
        200: ProjectsModel.fullSingleProjectRespBody,
        500: CommonModel.errorRespBody,
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
        200: ProjectsModel.fullMultipleProjectsRespBody,
        500: CommonModel.errorRespBody,
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
        200: ProjectsModel.fullSingleProjectRespBody,
        404: CommonModel.errorRespBody,
        500: CommonModel.errorRespBody,
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
      body: ProjectsModel.updateProjectReqBody,
      response: {
        200: ProjectsModel.fullSingleProjectRespBody,
        404: CommonModel.errorRespBody,
        500: CommonModel.errorRespBody,
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
        200: ProjectsModel.fullSingleProjectRespBody,
        404: CommonModel.errorRespBody,
        500: CommonModel.errorRespBody,
      },
    },
  )
