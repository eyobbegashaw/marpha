"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inventoryController = exports.InventoryController = void 0;
const inventory_service_1 = require("./inventory.service");
const apiResponse_1 = require("../../common/utils/apiResponse");
const auditLoggerMiddleware_1 = require("../../common/middlewares/auditLoggerMiddleware");
class InventoryController {
    async getOverview(req, res, next) {
        try {
            const orgId = req.user.organization_id;
            const branchId = req.query.branchId || req.user?.branch_id || undefined;
            const data = await inventory_service_1.inventoryService.getStockOverview(orgId, branchId);
            return apiResponse_1.ApiResponse.success(res, data, 'Stock overview retrieved successfully');
        }
        catch (error) {
            next(error);
        }
    }
    async getByLocation(req, res, next) {
        try {
            const orgId = req.user.organization_id;
            const locationId = req.params.locationId;
            const data = await inventory_service_1.inventoryService.getInventoryByLocation(orgId, locationId);
            return apiResponse_1.ApiResponse.success(res, data, 'Location inventory retrieved successfully');
        }
        catch (error) {
            next(error);
        }
    }
    async transferStock(req, res, next) {
        try {
            const orgId = req.user.organization_id;
            const userId = req.user.id;
            const result = await inventory_service_1.inventoryService.transferStock(orgId, userId, req.body);
            await (0, auditLoggerMiddleware_1.logAuditEvent)(req, 'TRANSFER_STOCK', 'inventory', result.transaction.id, req.body);
            return apiResponse_1.ApiResponse.success(res, result, result.message);
        }
        catch (error) {
            next(error);
        }
    }
    async adjustStock(req, res, next) {
        try {
            const orgId = req.user.organization_id;
            const userId = req.user.id;
            const result = await inventory_service_1.inventoryService.adjustStock(orgId, userId, req.body);
            await (0, auditLoggerMiddleware_1.logAuditEvent)(req, 'ADJUST_STOCK', 'inventory', result.transaction.id, req.body);
            return apiResponse_1.ApiResponse.success(res, result, result.message);
        }
        catch (error) {
            next(error);
        }
    }
    async recordLoss(req, res, next) {
        try {
            const orgId = req.user.organization_id;
            const userId = req.user.id;
            const result = await inventory_service_1.inventoryService.recordLoss(orgId, userId, req.body);
            await (0, auditLoggerMiddleware_1.logAuditEvent)(req, `RECORD_${req.body.lossType}`, 'inventory', result.transaction.id, req.body);
            return apiResponse_1.ApiResponse.success(res, result, result.message);
        }
        catch (error) {
            next(error);
        }
    }
    async getTransactions(req, res, next) {
        try {
            const orgId = req.user.organization_id;
            const filters = {
                branchId: req.query.branchId || undefined,
                productId: req.query.productId || undefined,
                batchId: req.query.batchId || undefined,
                transactionType: req.query.transactionType || undefined,
                startDate: req.query.startDate || undefined,
                endDate: req.query.endDate || undefined,
                limit: req.query.limit ? parseInt(req.query.limit, 10) : 50,
                offset: req.query.offset ? parseInt(req.query.offset, 10) : 0,
            };
            const data = await inventory_service_1.inventoryService.getTransactionHistory(orgId, filters);
            return apiResponse_1.ApiResponse.success(res, data, 'Inventory transaction history retrieved');
        }
        catch (error) {
            next(error);
        }
    }
}
exports.InventoryController = InventoryController;
exports.inventoryController = new InventoryController();
//# sourceMappingURL=inventory.controller.js.map