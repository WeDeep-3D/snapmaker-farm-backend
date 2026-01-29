import { Elysia } from 'elysia'

import { buildErrorResponse } from '@/utils/common'

import { scansModel } from './model'
import { Scans, scansService } from './service'

export const scans = new Elysia({ prefix: '/api/v1/scans', tags: ['Scans'] })
  .use(scansModel)
  .use(scansService)
  .post(
    '/',
    ({ body }) => {
      try {
        return Scans.createScan(body)
      } catch (error) {
        return buildErrorResponse(500, (error as Error).message)
      }
    },
    {
      body: 'createScanReqBody',
      response: {
        200: 'createScanRespBody',
        422: 'errorRespBody',
        500: 'errorRespBody',
      },
    },
  )
  .get(
    '/',
    () => {
      try {
        return Scans.getAllScans()
      } catch (error) {
        return buildErrorResponse(500, (error as Error).message)
      }
    },
    {
      response: {
        200: 'getAllScansRespBody',
        500: 'errorRespBody',
      },
    },
  )
  .get(
    '/:scanId',
    ({ params }) => {
      try {
        return Scans.getScan(params.scanId)
      } catch (error) {
        return buildErrorResponse(500, (error as Error).message)
      }
    },
    {
      response: {
        200: 'getScanRespBody',
        404: 'errorRespBody',
        500: 'errorRespBody',
      },
    },
  )
  .patch(
    '/',
    ({ body }) => {
      try {
        return Scans.updateScan(body)
      } catch (error) {
        return buildErrorResponse(500, (error as Error).message)
      }
    },
    {
      body: 'updateScanReqBody',
      response: {
        200: 'updateScanRespBody',
        500: 'errorRespBody',
      },
    },
  )
  .delete(
    '/',
    () => {
      try {
        return Scans.deleteAllScans()
      } catch (error) {
        return buildErrorResponse(500, (error as Error).message)
      }
    },
    {
      response: {
        200: 'deleteAllScansRespBody',
        500: 'errorRespBody',
      },
    },
  )
  .delete(
    '/:scanId',
    ({ params }) => {
      try {
        return Scans.deleteScan(params.scanId)
      } catch (error) {
        return buildErrorResponse(500, (error as Error).message)
      }
    },
    {
      response: {
        200: 'deleteScanRespBody',
        404: 'errorRespBody',
        500: 'errorRespBody',
      },
    },
  )
