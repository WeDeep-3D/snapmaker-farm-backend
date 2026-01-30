import { Elysia, t } from 'elysia'

import { buildErrorResponse } from '@/utils/common'

import { platesModel } from './model'
import { Plates, platesService } from './service'

export const plates = new Elysia({ prefix: '/api/v1/plates', tags: ['Plates'] })
  .use(platesModel)
  .use(platesService)
  .post(
    '/',
    async ({ body }) => {
      try {
        return Plates.createPlate(body)
      } catch (error) {
        return buildErrorResponse(500, (error as Error).message)
      }
    },
    {
      body: 'createPlateReqBody',
      response: {
        200: 'fullSinglePlateRespBody',
        500: 'errorRespBody',
      },
    },
  )
  .get(
    '/:plateId',
    ({ params }) => {
      try {
        return Plates.getPlate(params.plateId)
      } catch (error) {
        return buildErrorResponse(500, (error as Error).message)
      }
    },
    {
      params: t.Object({
        plateId: t.String({ format: 'uuid' }),
      }),
      response: {
        200: 'fullSinglePlateRespBody',
        404: 'errorRespBody',
        500: 'errorRespBody',
      },
    },
  )
  .patch(
    '/:plateId',
    async ({ body, params }) => {
      try {
        return Plates.updatePlate(params.plateId, body)
      } catch (error) {
        return buildErrorResponse(500, (error as Error).message)
      }
    },
    {
      body: 'updatePlateReqBody',
      response: {
        200: 'fullSinglePlateRespBody',
        404: 'errorRespBody',
        500: 'errorRespBody',
      },
    },
  )
  .delete(
    '/:plateId',
    async ({ params }) => {
      try {
        return Plates.deletePlate(params.plateId)
      } catch (error) {
        return buildErrorResponse(500, (error as Error).message)
      }
    },
    {
      response: {
        200: 'fullSinglePlateRespBody',
        404: 'errorRespBody',
        500: 'errorRespBody',
      },
    },
  )
