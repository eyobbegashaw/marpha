"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.batchesController = exports.BatchesController = void 0;
const batches_service_1 = require("./batches.service");
const apiResponse_1 = require("../../common/utils/apiResponse");
const auditLoggerMiddleware_1 = require("../../common/middlewares/auditLoggerMiddleware");
class BatchesController {
    async list(req, res, next) {
        try {
            const orgId = req.user.organization_id;
            const filters = {
                productId: req.query.productId,
                isQuarantined: req.query.isQuarantined !== undefined ? req.query.isQuarantined === 'true' : undefined,
                expiringBefore: req.query.expiringBefore,
            };
            const batches = await batches_service_1.batchesService.listBatches(orgId, filters);
            return apiResponse_1.ApiResponse.success(res, batches, 'Batches retrieved successfully');
        }
        catch (error) {
            next(error);
        }
    }
    async getById(req, res, next) {
        try {
            const orgId = req.user.organization_id;
            const batch = await batches_service_1.batchesService.getBatchById(orgId, req.params.id);
            return apiResponse_1.ApiResponse.success(res, batch, 'Batch retrieved successfully');
        }
        catch (error) {
            next(error);
        }
    }
    async create(req, res, next) {
        try {
            const orgId = req.user.organization_id;
            const batch = await batches_service_1.batchesService.createBatch(orgId, req.body);
            await (0, auditLoggerMiddleware_1.logAuditEvent)(req, 'CREATE_BATCH', 'product_batches', batch.id, { batchNumber: batch.batch_number });
            return apiResponse_1.ApiResponse.created(res, batch, 'Batch created successfully');
        }
        catch (error) {
            next(error);
        }
    }
    async updateQuarantine(req, res, next) {
        try {
            const orgId = req.user.organization_id;
            const { isQuarantined, notes } = req.body;
            const batch = await batches_service_1.batchesService.updateQuarantine(orgId, req.params.id, isQuarantined, notes);
            await (0, auditLoggerMiddleware_1.logAuditEvent)(req, isQuarantined ? 'QUARANTINE_BATCH' : 'UNQUARANTINE_BATCH', 'product_batches', batch.id, { notes });
            return apiResponse_1.ApiResponse.success(res, batch, 'Batch quarantine status updated');
        }
        catch (error) {
            next(error);
        }
    }
}
exports.BatchesController = BatchesController;
exports.batchesController = new BatchesController();
//# sourceMappingURL=batches.controller.js.map