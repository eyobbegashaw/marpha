"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.organizationsController = exports.OrganizationsController = void 0;
const organizations_service_1 = require("./organizations.service");
const apiResponse_1 = require("../../common/utils/apiResponse");
const auditLoggerMiddleware_1 = require("../../common/middlewares/auditLoggerMiddleware");
class OrganizationsController {
    async getOrg(req, res, next) {
        try {
            const orgId = req.user.organization_id;
            const org = await organizations_service_1.organizationsService.getOrganization(orgId);
            return apiResponse_1.ApiResponse.success(res, org, 'Organization details retrieved');
        }
        catch (error) {
            next(error);
        }
    }
    async updateOrg(req, res, next) {
        try {
            const orgId = req.user.organization_id;
            const org = await organizations_service_1.organizationsService.updateOrganization(orgId, req.body);
            await (0, auditLoggerMiddleware_1.logAuditEvent)(req, 'UPDATE_ORGANIZATION', 'organizations', orgId, req.body);
            return apiResponse_1.ApiResponse.success(res, org, 'Organization updated successfully');
        }
        catch (error) {
            next(error);
        }
    }
    async listBranches(req, res, next) {
        try {
            const orgId = req.user.organization_id;
            const branches = await organizations_service_1.organizationsService.listBranches(orgId);
            return apiResponse_1.ApiResponse.success(res, branches, 'Branches retrieved successfully');
        }
        catch (error) {
            next(error);
        }
    }
    async createBranch(req, res, next) {
        try {
            const orgId = req.user.organization_id;
            const branch = await organizations_service_1.organizationsService.createBranch(orgId, req.body);
            await (0, auditLoggerMiddleware_1.logAuditEvent)(req, 'CREATE_BRANCH', 'branches', branch.id, { name: branch.name, code: branch.code });
            return apiResponse_1.ApiResponse.created(res, branch, 'Branch created successfully');
        }
        catch (error) {
            next(error);
        }
    }
    async updateBranch(req, res, next) {
        try {
            const orgId = req.user.organization_id;
            const branch = await organizations_service_1.organizationsService.updateBranch(orgId, req.params.branchId, req.body);
            await (0, auditLoggerMiddleware_1.logAuditEvent)(req, 'UPDATE_BRANCH', 'branches', branch.id, req.body);
            return apiResponse_1.ApiResponse.success(res, branch, 'Branch updated successfully');
        }
        catch (error) {
            next(error);
        }
    }
}
exports.OrganizationsController = OrganizationsController;
exports.organizationsController = new OrganizationsController();
//# sourceMappingURL=organizations.controller.js.map