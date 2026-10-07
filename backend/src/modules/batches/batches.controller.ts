import { Request, Response, NextFunction } from 'express';
import { batchesService } from './batches.service';
import { ApiResponse } from '../../common/utils/apiResponse';
import { logAuditEvent } from '../../common/middlewares/auditLoggerMiddleware';

export class BatchesController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.user!.organization_id!;
      const filters = {
        productId: req.query.productId as string | undefined,
        isQuarantined: req.query.isQuarantined !== undefined ? req.query.isQuarantined === 'true' : undefined,
        expiringBefore: req.query.expiringBefore as string | undefined,
      };
      const batches = await batchesService.listBatches(orgId, filters);
      return ApiResponse.success(res, batches, 'Batches retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.user!.organization_id!;
      const batch = await batchesService.getBatchById(orgId, req.params.id);
      return ApiResponse.success(res, batch, 'Batch retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.user!.organization_id!;
      const batch = await batchesService.createBatch(orgId, req.body);
      await logAuditEvent(req, 'CREATE_BATCH', 'product_batches', batch.id, { batchNumber: batch.batch_number });
      return ApiResponse.created(res, batch, 'Batch created successfully');
    } catch (error) {
      next(error);
    }
  }

  async updateQuarantine(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.user!.organization_id!;
      const { isQuarantined, notes } = req.body;
      const batch = await batchesService.updateQuarantine(orgId, req.params.id, isQuarantined, notes);
      await logAuditEvent(req, isQuarantined ? 'QUARANTINE_BATCH' : 'UNQUARANTINE_BATCH', 'product_batches', batch.id, { notes });
      return ApiResponse.success(res, batch, 'Batch quarantine status updated');
    } catch (error) {
      next(error);
    }
  }
}

export const batchesController = new BatchesController();
