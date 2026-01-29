import { eq } from 'drizzle-orm'
import { Elysia } from 'elysia'

import { db } from '@/database'
import { plates } from '@/database/schema'
import { log } from '@/log'

import { PlatesModel } from './model'
import { buildErrorResponse, buildSuccessResponse } from '@/utils/common'

export abstract class Plates {
  static async createPlate(data: PlatesModel.CreatePlateReqBody) {
    try {
      const insertedPlate = (
        await db.insert(plates).values(data).returning()
      )[0]
      if (!insertedPlate) {
        return buildErrorResponse(500, 'Failed to create plate')
      }
      return buildSuccessResponse(insertedPlate)
    } catch (error) {
      log.error(error, 'Database error while creating plate')
      throw error
    }
  }
  static async getPlate(plateId: string) {
    try {
      const selectedPlate = (
        await db.select().from(plates).where(eq(plates.id, plateId)).limit(1)
      )[0]
      if (!selectedPlate) {
        return buildErrorResponse(404, 'Plate not found')
      }
      return buildSuccessResponse(selectedPlate)
    } catch (error) {
      log.error(error, 'Database error while fetching plate')
      throw error
    }
  }
  static async updatePlate(
    plateId: string,
    data: typeof PlatesModel.updatePlateReqBody.static,
  ) {
    try {
      const updatedPlate = (
        await db
          .update(plates)
          .set(data)
          .where(eq(plates.id, plateId))
          .returning()
      )[0]
      if (!updatedPlate) {
        return buildErrorResponse(404, 'Plate not found')
      }
      return buildSuccessResponse(updatedPlate)
    } catch (error) {
      log.error(error, 'Database error while updating plate')
      throw error
    }
  }
  static async deletePlate(plateId: string) {
    try {
      const deletedPlate = (
        await db.delete(plates).where(eq(plates.id, plateId)).returning()
      )[0]
      if (!deletedPlate) {
        return buildErrorResponse(404, 'Plate not found')
      }
      return buildSuccessResponse(deletedPlate)
    } catch (error) {
      log.error(error, 'Database error while deleting plate')
      throw error
    }
  }
}

export const platesService = new Elysia({ name: 'plates.service' })
