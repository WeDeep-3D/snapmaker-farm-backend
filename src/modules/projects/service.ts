import { eq } from 'drizzle-orm'
import { Elysia } from 'elysia'

import { db } from '@/database'
import { projects } from '@/database/schema'
import { log } from '@/log'
import { buildErrorResponse, buildSuccessResponse } from '@/utils/common'

import type { CreateProjectReqBody, UpdateProjectReqBody } from './model'

export abstract class Project {
  static async createProject(data: CreateProjectReqBody) {
    try {
      const insertedProject = (await db.insert(projects).values(data).returning())[0]
      if (!insertedProject) {
        return buildErrorResponse(500, 'Failed to create project')
      }
      return buildSuccessResponse(insertedProject)
    } catch (error) {
      log.error(error, 'Database error while creating project')
      throw error
    }
  }
  static async getAllProjects() {
    try {
      return buildSuccessResponse(await db.select().from(projects))
    } catch (error) {
      log.error(error, 'Database error while fetching all projects')
      throw error
    }
  }
  static async getProject(projectId: string) {
    try {
      const selectedProject = (
        await db.select().from(projects).where(eq(projects.id, projectId)).limit(1)
      )[0]
      if (!selectedProject) {
        return buildErrorResponse(404, 'Project not found')
      }
      return buildSuccessResponse(selectedProject)
    } catch (error) {
      log.error(error, 'Database error while fetching project')
      throw error
    }
  }
  static async updateProject(projectId: string, data: UpdateProjectReqBody) {
    try {
      const updatedProject = (
        await db.update(projects).set(data).where(eq(projects.id, projectId)).returning()
      )[0]
      if (!updatedProject) {
        return buildErrorResponse(404, 'Project not found')
      }
      return buildSuccessResponse(updatedProject)
    } catch (error) {
      log.error(error, 'Database error while updating project')
      throw error
    }
  }
  static async deleteProject(projectId: string) {
    try {
      const deletedProject = (
        await db.delete(projects).where(eq(projects.id, projectId)).returning()
      )[0]
      if (!deletedProject) {
        return buildErrorResponse(404, 'Project not found')
      }
      return buildSuccessResponse(deletedProject)
    } catch (error) {
      log.error(error, 'Database error while deleting project')
      throw error
    }
  }
}

export const projectsService = new Elysia({ name: 'projects.service' })
