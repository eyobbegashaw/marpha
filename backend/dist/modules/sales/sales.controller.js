"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.salesController = exports.SalesController = void 0;
const sales_service_1 = require("./sales.service");
const apiResponse_1 = require("../../common/utils/apiResponse");
const auditLoggerMiddleware_1 = require("../../common/middlewares/auditLoggerMiddleware");
class SalesController {
    async list(req, res, next) {
        try {
            const orgId = req.user.organization_id;
            const filters = {
                branchId: req.query.branchId || undefined,
                cashierId: req.query.cashierId || undefined,
                buyerId: req.query.buyerId || undefined,
                startDate: req.query.startDate || undefined,
                endDate: req.query.endDate || undefined,
                limit: req.query.limit ? parseInt(req.query.limit, 10) : 50,
                offset: req.query.offset ? parseInt(req.query.offset, 10) : 0,
            };
            const sales = await sales_service_1.salesService.listSales(orgId, filters);
            return apiResponse_1.ApiResponse.success(res, sales, 'Sales invoices retrieved successfully');
        }
        catch (error) {
            next(error);
        }
    }
    async getById(req, res, next) {
        try {
            const orgId = req.user.organization_id;
            const sale = await sales_service_1.salesService.getSaleById(orgId, req.params.id);
            return apiResponse_1.ApiResponse.success(res, sale, 'Sale details retrieved');
        }
        catch (error) {
            next(error);
        }
    }
    async checkout(req, res, next) {
        try {
            const orgId = req.user.organization_id;
            const cashierId = req.user.id;
            const result = await sales_service_1.salesService.createSale(orgId, cashierId, req.body);
            await (0, auditLoggerMiddleware_1.logAuditEvent)(req, 'CREATE_SALE', 'sales', result.sale.id, { invoice: result.sale.invoice_number, total: result.sale.total_amount });
            return apiResponse_1.ApiResponse.created(res, result, result.message);
        }
        catch (error) {
            next(error);
        }
    }
    async getMyPurchases(req, res, next) {
        try {
            const userId = req.user.id;
            const purchases = await sales_service_1.salesService.getMyPurchases(userId);
            return apiResponse_1.ApiResponse.success(res, purchases, 'My purchases retrieved successfully');
        }
        catch (error) {
            next(error);
        }
    }
    async getMyPurchaseById(req, res, next) {
        try {
            const userId = req.user.id;
            const purchase = await sales_service_1.salesService.getMyPurchaseById(userId, req.params.id);
            return apiResponse_1.ApiResponse.success(res, purchase, 'Purchase details retrieved successfully');
        }
        catch (error) {
            next(error);
        }
    }
}
exports.SalesController = SalesController;
exports.salesController = new SalesController();
//# sourceMappingURL=sales.controller.js.map