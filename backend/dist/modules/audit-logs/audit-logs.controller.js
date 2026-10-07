"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditLogsController = exports.AuditLogsController = void 0;
const audit_logs_service_1 = require("./audit-logs.service");
const apiResponse_1 = require("../../common/utils/apiResponse");
class AuditLogsController {
    async list(req, res, next) {
        try {
            const orgId = req.user.organization_id;
            const filters = {
                userId: req.query.userId || undefined,
                action: req.query.action || undefined,
                entityName: req.query.entityName || undefined,
                startDate: req.query.startDate || undefined,
                endDate: req.query.endDate || undefined,
                limit: req.query.limit ? parseInt(req.query.limit, 10) : 50,
                offset: req.query.offset ? parseInt(req.query.offset, 10) : 0,
            };
            const data = await audit_logs_service_1.auditLogsService.listLogs(orgId, filters);
            return apiResponse_1.ApiResponse.success(res, data, 'Audit logs retrieved successfully');
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AuditLogsController = AuditLogsController;
exports.auditLogsController = new AuditLogsController();
//# sourceMappingURL=audit-logs.controller.js.map