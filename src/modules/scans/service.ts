import { Elysia } from 'elysia'

import { buildErrorResponse, buildSuccessResponse } from '@/utils/common'

import { ScansHelper } from './helper'
import type { CreateScanReqBody, UpdateScanReqBody } from './model'
import { resolveIpRanges } from './utils'

const scanHelper = new ScansHelper()

export abstract class Scans {
  private static _maxCount = 65535n

  static async createScan(ranges: CreateScanReqBody) {
    let ipsToCheck: string[]
    try {
      ipsToCheck = resolveIpRanges(ranges, Scans._maxCount)
    } catch (error) {
      return buildErrorResponse(422, (error as Error).message)
    }
    return buildSuccessResponse(scanHelper.create(ipsToCheck))
  }

  static async getAllScans() {
    return buildSuccessResponse(scanHelper.info)
  }

  static async getScan(scanId: string) {
    const scan = scanHelper.retrieve(scanId)
    if (!scan) {
      return buildErrorResponse(404, 'Scan not found')
    }
    return buildSuccessResponse(scan)
  }

  static async updateScan(config: UpdateScanReqBody) {
    if (config.concurrency !== undefined) {
      scanHelper.concurrency = config.concurrency
    }
    if (config.timeout !== undefined) {
      scanHelper.timeout = config.timeout
    }
    return buildSuccessResponse(scanHelper.configs)
  }

  static async deleteAllScans() {
    return buildSuccessResponse(scanHelper.deleteAll())
  }

  static async deleteScan(scanId: string) {
    const deleted = scanHelper.delete(scanId)
    if (!deleted) {
      return buildErrorResponse(404, 'Scan not found')
    }
    return buildSuccessResponse()
  }
}

export const scansService = new Elysia({ name: 'scans.service' })
