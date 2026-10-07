"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.purchasesController = exports.PurchasesController = void 0;
const purchases_service_1 = require("./purchases.service");
const apiResponse_1 = require("../../common/utils/apiResponse");
const auditLoggerMiddleware_1 = require("../../common/middlewares/auditLoggerMiddleware");
class PurchasesController {
    async list(req, res, next) {
        try {
            const orgId = req.user.organization_id;
            const branchId = req.query.branchId || undefined;
            const status = req.query.status || undefined;
            const purchases = await purchases_service_1.purchasesService.listPurchases(orgId, branchId, status);
            return apiResponse_1.ApiResponse.success(res, purchases, 'Purchases retrieved successfully');
        }
        catch (error) {
            next(error);
        }
    }
    async getById(req, res, next) {
        try {
            const orgId = req.user.organization_id;
            const purchase = await purchases_service_1.purchasesService.getPurchaseById(orgId, req.params.id);
            return apiResponse_1.ApiResponse.success(res, purchase, 'Purchase order details retrieved');
        }
        catch (error) {
            next(error);
        }
    }
    async create(req, res, next) {
        try {
            const orgId = req.user.organization_id;
            const userId = req.user.id;
            const purchase = await purchases_service_1.purchasesService.createPurchase(orgId, userId, req.body);
            await (0, auditLoggerMiddleware_1.logAuditEvent)(req, 'CREATE_PURCHASE_ORDER', 'purchases', purchase.id, { invoiceNumber: purchase.invoice_number, total: purchase.total_amount });
            return apiResponse_1.ApiResponse.created(res, purchase, 'Purchase order created successfully');
        }
        catch (error) {
            next(error);
        }
    }
    async submit(req, res, next) {
        try {
            const orgId = req.user.organization_id;
            const purchase = await purchases_service_1.purchasesService.submitPurchase(orgId, req.params.id);
            await (0, auditLoggerMiddleware_1.logAuditEvent)(req, 'SUBMIT_PURCHASE_ORDER', 'purchases', purchase.id, {});
            return apiResponse_1.ApiResponse.success(res, purchase, 'Purchase order submitted for approval');
        }
        catch (error) {
            next(error);
        }
    }
    async approve(req, res, next) {
        try {
            const orgId = req.user.organization_id;
            const userId = req.user.id;
            const purchase = await purchases_service_1.purchasesService.approvePurchase(orgId, req.params.id, userId);
            await (0, auditLoggerMiddleware_1.logAuditEvent)(req, 'APPROVE_PURCHASE_ORDER', 'purchases', purchase.id, {});
            return apiResponse_1.ApiResponse.success(res, purchase, 'Purchase order approved');
        }
        catch (error) {
            next(error);
        }
    }
    async order(req, res, next) {
        try {
            const orgId = req.user.organization_id;
            const userId = req.user.id;
            const purchase = await purchases_service_1.purchasesService.orderPurchase(orgId, req.params.id, userId);
            await (0, auditLoggerMiddleware_1.logAuditEvent)(req, 'ORDER_PURCHASE', 'purchases', purchase.id, {});
            return apiResponse_1.ApiResponse.success(res, purchase, 'Purchase order placed with supplier');
        }
        catch (error) {
            next(error);
        }
    }
    async receive(req, res, next) {
        try {
            const orgId = req.user.organization_id;
            const userId = req.user.id;
            const purchase = await purchases_service_1.purchasesService.receiveGoods(orgId, req.params.id, userId, req.body.receivedItems);
            await (0, auditLoggerMiddleware_1.logAuditEvent)(req, 'RECEIVE_PURCHASE_GOODS', 'purchases', purchase.id, { status: purchase.status });
            return apiResponse_1.ApiResponse.success(res, purchase, `Purchase order goods received (Status: ${purchase.status})`);
        }
        catch (error) {
            next(error);
        }
    }
    async cancel(req, res, next) {
        try {
            const orgId = req.user.organization_id;
            const userId = req.user.id;
            const { reason } = req.body;
            const purchase = await purchases_service_1.purchasesService.cancelPurchase(orgId, req.params.id, userId, reason);
            await (0, auditLoggerMiddleware_1.logAuditEvent)(req, 'CANCEL_PURCHASE_ORDER', 'purchases', purchase.id, { reason });
            return apiResponse_1.ApiResponse.success(res, purchase, 'Purchase order cancelled');
        }
        catch (error) {
            next(error);
        }
    }
}
exports.PurchasesController = PurchasesController;
exports.purchasesController = new PurchasesController();
//# sourceMappingURL=purchases.controller.js.map