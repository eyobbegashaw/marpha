import { Request, Response, NextFunction } from 'express';
import { inventoryService } from './inventory.service';
import { ApiResponse } from '../../common/utils/apiResponse';
import { logAuditEvent } from '../../common/middlewares/auditLoggerMiddleware';

export class InventoryController {
  async getOverview(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.user!.organization_id!;
      const branchId = (req.query.branchId as string) || req.user?.branch_id || undefined;
      const data = await inventoryService.getStockOverview(orgId, branchId);
      return ApiResponse.success(res, data, 'Stock overview retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async getByLocation(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.user!.organization_id!;
      const locationId = req.params.locationId;
      const data = await inventoryService.getInventoryByLocation(orgId, locationId);
      return ApiResponse.success(res, data, 'Location inventory retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async transferStock(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.user!.organization_id!;
      const userId = req.user!.id;
      const result = await inventoryService.transferStock(orgId, userId, req.body);
      await logAuditEvent(req, 'TRANSFER_STOCK', 'inventory', result.transaction.id, req.body);
      return ApiResponse.success(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }

  async adjustStock(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.user!.organization_id!;
      const userId = req.user!.id;
      const result = await inventoryService.adjustStock(orgId, userId, req.body);
      await logAuditEvent(req, 'ADJUST_STOCK', 'inventory', result.transaction.id, req.body);
      return ApiResponse.success(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }

  async recordLoss(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.user!.organization_id!;
      const userId = req.user!.id;
      const result = await inventoryService.recordLoss(orgId, userId, req.body);
      await logAuditEvent(req, `RECORD_${req.body.lossType}`, 'inventory', result.transaction.id, req.body);
      return ApiResponse.success(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }

  async getTransactions(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.user!.organization_id!;
      const filters = {
        branchId: (req.query.branchId as string) || undefined,
        productId: (req.query.productId as string) || undefined,
        batchId: (req.query.batchId as string) || undefined,
        transactionType: (req.query.transactionType as string) || undefined,
        startDate: (req.query.startDate as string) || undefined,
        endDate: (req.query.endDate as string) || undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 50,
        offset: req.query.offset ? parseInt(req.query.offset as string, 10) : 0,
      };
      const data = await inventoryService.getTransactionHistory(orgId, filters);
      return ApiResponse.success(res, data, 'Inventory transaction history retrieved');
    } catch (error) {
      next(error);
    }
  }
}

export const inventoryController = new InventoryController();
