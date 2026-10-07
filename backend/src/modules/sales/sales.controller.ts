import { Request, Response, NextFunction } from 'express';
import { salesService } from './sales.service';
import { ApiResponse } from '../../common/utils/apiResponse';
import { logAuditEvent } from '../../common/middlewares/auditLoggerMiddleware';

export class SalesController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.user!.organization_id!;
      const filters = {
        branchId: (req.query.branchId as string) || undefined,
        cashierId: (req.query.cashierId as string) || undefined,
        buyerId: (req.query.buyerId as string) || undefined,
        startDate: (req.query.startDate as string) || undefined,
        endDate: (req.query.endDate as string) || undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 50,
        offset: req.query.offset ? parseInt(req.query.offset as string, 10) : 0,
      };
      const sales = await salesService.listSales(orgId, filters);
      return ApiResponse.success(res, sales, 'Sales invoices retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.user!.organization_id!;
      const sale = await salesService.getSaleById(orgId, req.params.id);
      return ApiResponse.success(res, sale, 'Sale details retrieved');
    } catch (error) {
      next(error);
    }
  }

  async checkout(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.user!.organization_id!;
      const cashierId = req.user!.id;
      const result = await salesService.createSale(orgId, cashierId, req.body);
      await logAuditEvent(req, 'CREATE_SALE', 'sales', result.sale.id, { invoice: result.sale.invoice_number, total: result.sale.total_amount });
      return ApiResponse.created(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }

  async getMyPurchases(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const purchases = await salesService.getMyPurchases(userId);
      return ApiResponse.success(res, purchases, 'My purchases retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async getMyPurchaseById(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const purchase = await salesService.getMyPurchaseById(userId, req.params.id);
      return ApiResponse.success(res, purchase, 'Purchase details retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const salesController = new SalesController();
