import { Elysia, status } from 'elysia'

import { CommonModel } from '@/utils/model'

import { ScansModel } from './model'
import { Scans, scansService } from './service'

export const scans = new Elysia({ prefix: '/api/v1/scans', tags: ['Scans'] })
  .use(scansService)
  .post(
    '/',
    ({ body }) => {
      try {
        return Scans.createScan(body)
      } catch (error) {
        return status(500, {
          success: false,
          message: (error as Error).message,
        })
      }
    },
    {
      body: ScansModel.createScanReqBody,
      response: {
        200: ScansModel.createScanRespBody,
        422: CommonModel.errorRespBody,
        500: CommonModel.errorRespBody,
      },
    },
  )
  .get(
    '/',
    () => {
      try {
        return Scans.getAllScans()
      } catch (error) {
        return status(500, {
          success: false,
          message: (error as Error).message,
        })
      }
    },
    {
      response: {
        200: ScansModel.getAllScansRespBody,
        500: CommonModel.errorRespBody,
      },
    },
  )
  .get(
    '/:scanId',
    ({ params }) => {
      try {
        return Scans.getScan(params.scanId)
      } catch (error) {
        return status(500, {
          success: false,
          message: (error as Error).message,
        })
      }
    },
    {
      response: {
        200: ScansModel.getScanRespBody,
        404: CommonModel.errorRespBody,
        500: CommonModel.errorRespBody,
      },
    },
  )
  .patch(
    '/',
    ({ body }) => {
      try {
        return Scans.updateScan(body)
      } catch (error) {
        return status(500, {
          success: false,
          message: (error as Error).message,
        })
      }
    },
    {
      body: ScansModel.updateScanReqBody,
      response: {
        200: ScansModel.updateScanRespBody,
        500: CommonModel.errorRespBody,
      },
    },
  )
  .delete(
    '/',
    () => {
      try {
        return Scans.deleteAllScans()
      } catch (error) {
        return status(500, {
          success: false,
          message: (error as Error).message,
        })
      }
    },
    {
      response: {
        200: ScansModel.deleteAllScansRespBody,
        500: CommonModel.errorRespBody,
      },
    },
  )
  .delete(
    '/:scanId',
    ({ params }) => {
      try {
        return Scans.deleteScan(params.scanId)
      } catch (error) {
        return status(500, {
          success: false,
          message: (error as Error).message,
        })
      }
    },
    {
      response: {
        200: ScansModel.deleteScanRespBody,
        404: CommonModel.errorRespBody,
        500: CommonModel.errorRespBody,
      },
    },
  )
