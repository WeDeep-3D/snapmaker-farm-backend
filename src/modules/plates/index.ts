import { Elysia, status, t } from 'elysia'

import { CommonModel } from '@/utils/model'

import { PlatesModel } from './model'
import { Plates, platesService } from './service'

export const plates = new Elysia({ prefix: '/api/v1/plates', tags: ['Plates'] })
  .use(platesService)
  .post(
    '/',
    async ({ body }) => {
      try {
        return Plates.createPlate(body)
      } catch (error) {
        return status(500, {
          success: false,
          message: (error as Error).message,
        })
      }
    },
    {
      body: PlatesModel.createPlateReqBody,
      response: {
        200: PlatesModel.fullSinglePlateRespBody,
        500: CommonModel.errorRespBody,
      },
    },
  )
  .get(
    '/:plateId',
    ({ params }) => {
      try {
        return Plates.getPlate(params.plateId)
      } catch (error) {
        return status(500, {
          success: false,
          message: (error as Error).message,
        })
      }
    },
    {
      params: t.Object({
        plateId: t.String({ format: 'uuid' }),
      }),
      response: {
        200: PlatesModel.fullSinglePlateRespBody,
        404: CommonModel.errorRespBody,
        500: CommonModel.errorRespBody,
      },
    },
  )
  .patch(
    '/:plateId',
    async ({ body, params }) => {
      try {
        return Plates.updatePlate(params.plateId, body)
      } catch (error) {
        return status(500, {
          success: false,
          message: (error as Error).message,
        })
      }
    },
    {
      body: PlatesModel.updatePlateReqBody,
      response: {
        200: PlatesModel.fullSinglePlateRespBody,
        404: CommonModel.errorRespBody,
        500: CommonModel.errorRespBody,
      },
    },
  )
  .delete(
    '/:plateId',
    async ({ params }) => {
      try {
        return Plates.deletePlate(params.plateId)
      } catch (error) {
        return status(500, {
          success: false,
          message: (error as Error).message,
        })
      }
    },
    {
      response: {
        200: PlatesModel.fullSinglePlateRespBody,
        404: CommonModel.errorRespBody,
        500: CommonModel.errorRespBody,
      },
    },
  )
