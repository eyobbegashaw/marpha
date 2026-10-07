"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usersController = exports.UsersController = void 0;
const users_service_1 = require("./users.service");
const apiResponse_1 = require("../../common/utils/apiResponse");
const auditLoggerMiddleware_1 = require("../../common/middlewares/auditLoggerMiddleware");
class UsersController {
    async list(req, res, next) {
        try {
            const orgId = req.user.organization_id;
            const branchId = req.query.branchId;
            const roleName = req.query.roleName;
            const users = await users_service_1.usersService.listUsers(orgId, branchId, roleName);
            return apiResponse_1.ApiResponse.success(res, users, 'Users retrieved successfully');
        }
        catch (error) {
            next(error);
        }
    }
    async getById(req, res, next) {
        try {
            const orgId = req.user.organization_id;
            const user = await users_service_1.usersService.getUserById(orgId, req.params.id);
            return apiResponse_1.ApiResponse.success(res, user, 'User retrieved successfully');
        }
        catch (error) {
            next(error);
        }
    }
    async create(req, res, next) {
        try {
            const orgId = req.user.organization_id;
            const user = await users_service_1.usersService.createUser(orgId, req.body);
            await (0, auditLoggerMiddleware_1.logAuditEvent)(req, 'CREATE_USER', 'users', user.id, { email: user.email, role: user.role });
            return apiResponse_1.ApiResponse.created(res, user, 'User created successfully');
        }
        catch (error) {
            next(error);
        }
    }
    async update(req, res, next) {
        try {
            const orgId = req.user.organization_id;
            const user = await users_service_1.usersService.updateUser(orgId, req.params.id, req.body);
            await (0, auditLoggerMiddleware_1.logAuditEvent)(req, 'UPDATE_USER', 'users', user.id, req.body);
            return apiResponse_1.ApiResponse.success(res, user, 'User updated successfully');
        }
        catch (error) {
            next(error);
        }
    }
    async toggleStatus(req, res, next) {
        try {
            const orgId = req.user.organization_id;
            const { isActive } = req.body;
            const user = await users_service_1.usersService.setUserStatus(orgId, req.params.id, isActive);
            const action = isActive ? 'ACTIVATE_USER' : 'DEACTIVATE_USER';
            await (0, auditLoggerMiddleware_1.logAuditEvent)(req, action, 'users', user.id, { isActive });
            return apiResponse_1.ApiResponse.success(res, user, `User account ${isActive ? 'activated' : 'deactivated'} successfully`);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.UsersController = UsersController;
exports.usersController = new UsersController();
//# sourceMappingURL=users.controller.js.map