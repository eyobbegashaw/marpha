import { Request, Response, NextFunction } from 'express';
import { purchasesService } from './purchases.service';
import { ApiResponse } from '../../common/utils/apiResponse';
import { logAuditEvent } from '../../common/middlewares/auditLoggerMiddleware';

export class PurchasesController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.user!.organization_id!;
      const branchId = (req.query.branchId as string) || undefined;
      const status = (req.query.status as string) || undefined;
      const purchases = await purchasesService.listPurchases(orgId, branchId, status);
      return ApiResponse.success(res, purchases, 'Purchases retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.user!.organization_id!;
      const purchase = await purchasesService.getPurchaseById(orgId, req.params.id);
      return ApiResponse.success(res, purchase, 'Purchase order details retrieved');
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.user!.organization_id!;
      const userId = req.user!.id;
      const purchase = await purchasesService.createPurchase(orgId, userId, req.body);
      await logAuditEvent(req, 'CREATE_PURCHASE_ORDER', 'purchases', purchase.id, { invoiceNumber: purchase.invoice_number, total: purchase.total_amount });
      return ApiResponse.created(res, purchase, 'Purchase order created successfully');
    } catch (error) {
      next(error);
    }
  }

  async submit(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.user!.organization_id!;
      const purchase = await purchasesService.submitPurchase(orgId, req.params.id);
      await logAuditEvent(req, 'SUBMIT_PURCHASE_ORDER', 'purchases', purchase.id, {});
      return ApiResponse.success(res, purchase, 'Purchase order submitted for approval');
    } catch (error) {
      next(error);
    }
  }

  async approve(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.user!.organization_id!;
      const userId = req.user!.id;
      const purchase = await purchasesService.approvePurchase(orgId, req.params.id, userId);
      await logAuditEvent(req, 'APPROVE_PURCHASE_ORDER', 'purchases', purchase.id, {});
      return ApiResponse.success(res, purchase, 'Purchase order approved');
    } catch (error) {
      next(error);
    }
  }

  async order(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.user!.organization_id!;
      const userId = req.user!.id;
      const purchase = await purchasesService.orderPurchase(orgId, req.params.id, userId);
      await logAuditEvent(req, 'ORDER_PURCHASE', 'purchases', purchase.id, {});
      return ApiResponse.success(res, purchase, 'Purchase order placed with supplier');
    } catch (error) {
      next(error);
    }
  }

  async receive(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.user!.organization_id!;
      const userId = req.user!.id;
      const purchase = await purchasesService.receiveGoods(orgId, req.params.id, userId, req.body.receivedItems);
      await logAuditEvent(req, 'RECEIVE_PURCHASE_GOODS', 'purchases', purchase.id, { status: purchase.status });
      return ApiResponse.success(res, purchase, `Purchase order goods received (Status: ${purchase.status})`);
    } catch (error) {
      next(error);
    }
  }

  async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.user!.organization_id!;
      const userId = req.user!.id;
      const { reason } = req.body;
      const purchase = await purchasesService.cancelPurchase(orgId, req.params.id, userId, reason);
      await logAuditEvent(req, 'CANCEL_PURCHASE_ORDER', 'purchases', purchase.id, { reason });
      return ApiResponse.success(res, purchase, 'Purchase order cancelled');
    } catch (error) {
      next(error);
    }
  }
}

export const purchasesController = new PurchasesController();
