"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = exports.AuthController = void 0;
const auth_service_1 = require("./auth.service");
const apiResponse_1 = require("../../common/utils/apiResponse");
const auditLoggerMiddleware_1 = require("../../common/middlewares/auditLoggerMiddleware");
class AuthController {
    async register(req, res, next) {
        try {
            const result = await auth_service_1.authService.registerOwner(req.body);
            await (0, auditLoggerMiddleware_1.logAuditEvent)(req, 'REGISTER_PHARMACY', 'organizations', result.organization.id, { email: req.body.email });
            return apiResponse_1.ApiResponse.created(res, result, 'Pharmacy registered successfully');
        }
        catch (error) {
            next(error);
        }
    }
    async login(req, res, next) {
        try {
            const { email, password } = req.body;
            const result = await auth_service_1.authService.login(email, password);
            await (0, auditLoggerMiddleware_1.logAuditEvent)(req, 'LOGIN', 'users', result.user.id, { email });
            return apiResponse_1.ApiResponse.success(res, result, 'Login successful');
        }
        catch (error) {
            next(error);
        }
    }
    async getProfile(req, res, next) {
        try {
            const result = await auth_service_1.authService.getProfile(req.user.id);
            return apiResponse_1.ApiResponse.success(res, result, 'User profile fetched successfully');
        }
        catch (error) {
            next(error);
        }
    }
    async changePassword(req, res, next) {
        try {
            const { currentPassword, newPassword } = req.body;
            const result = await auth_service_1.authService.changePassword(req.user.id, currentPassword, newPassword);
            await (0, auditLoggerMiddleware_1.logAuditEvent)(req, 'CHANGE_PASSWORD', 'users', req.user.id);
            return apiResponse_1.ApiResponse.success(res, result, 'Password changed successfully');
        }
        catch (error) {
            next(error);
        }
    }
    async updateLanguage(req, res, next) {
        try {
            const { language } = req.body;
            const result = await auth_service_1.authService.updateLanguage(req.user.id, language);
            return apiResponse_1.ApiResponse.success(res, result, 'Language updated successfully');
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AuthController = AuthController;
exports.authController = new AuthController();
//# sourceMappingURL=auth.controller.js.map