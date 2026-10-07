"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prescriptionsController = exports.PrescriptionsController = void 0;
const prescriptions_service_1 = require("./prescriptions.service");
const apiResponse_1 = require("../../common/utils/apiResponse");
const auditLoggerMiddleware_1 = require("../../common/middlewares/auditLoggerMiddleware");
class PrescriptionsController {
    async list(req, res, next) {
        try {
            const orgId = req.user.organization_id;
            const branchId = req.query.branchId || undefined;
            const customerId = req.query.customerId || undefined;
            const status = req.query.status || undefined;
            const data = await prescriptions_service_1.prescriptionsService.listPrescriptions(orgId, branchId, customerId, status);
            return apiResponse_1.ApiResponse.success(res, data, 'Prescriptions retrieved successfully');
        }
        catch (error) {
            next(error);
        }
    }
    async getById(req, res, next) {
        try {
            const orgId = req.user.organization_id;
            const data = await prescriptions_service_1.prescriptionsService.getPrescriptionById(orgId, req.params.id);
            return apiResponse_1.ApiResponse.success(res, data, 'Prescription details retrieved');
        }
        catch (error) {
            next(error);
        }
    }
    async create(req, res, next) {
        try {
            const orgId = req.user.organization_id;
            const userId = req.user.id;
            const data = await prescriptions_service_1.prescriptionsService.createPrescription(orgId, userId, req.body);
            await (0, auditLoggerMiddleware_1.logAuditEvent)(req, 'CREATE_PRESCRIPTION', 'prescriptions', data.id, { doctor: data.doctor_name });
            return apiResponse_1.ApiResponse.created(res, data, 'Prescription created successfully');
        }
        catch (error) {
            next(error);
        }
    }
}
exports.PrescriptionsController = PrescriptionsController;
exports.prescriptionsController = new PrescriptionsController();
//# sourceMappingURL=prescriptions.controller.js.map