import { eq } from 'drizzle-orm'
import { Elysia, status } from 'elysia'

import { db } from '@/database'
import { plates } from '@/database/schema'
import { log } from '@/log'

import { PlatesModel } from './model'

export abstract class Plates {
  static async createPlate(data: typeof PlatesModel.createPlateReqBody.static) {
    try {
      const insertedPlate = (
        await db.insert(plates).values(data).returning()
      )[0]
      if (!insertedPlate) {
        return status(500, {
          success: false,
          message: 'Failed to create plate',
        })
      }
      return status(200, { success: true, data: insertedPlate })
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
        return status(404, { success: false, message: 'Plate not found' })
      }
      return status(200, { success: true, data: selectedPlate })
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
        return status(404, { success: false, message: 'Plate not found' })
      }
      return status(200, { success: true, data: updatedPlate })
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
        return status(404, { success: false, message: 'Plate not found' })
      }
      return status(200, { success: true, data: deletedPlate })
    } catch (error) {
      log.error(error, 'Database error while deleting plate')
      throw error
    }
  }
}

export const platesService = new Elysia({ name: 'plates.service' })
