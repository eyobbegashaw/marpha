"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationsController = exports.NotificationsController = void 0;
const notifications_service_1 = require("./notifications.service");
const apiResponse_1 = require("../../common/utils/apiResponse");
class NotificationsController {
    async list(req, res, next) {
        try {
            const orgId = req.user.organization_id;
            const branchId = req.query.branchId || undefined;
            const isRead = req.query.isRead !== undefined ? req.query.isRead === 'true' : undefined;
            const isResolved = req.query.isResolved !== undefined ? req.query.isResolved === 'true' : undefined;
            const data = await notifications_service_1.notificationsService.listNotifications(orgId, req.user.id, branchId, isRead, isResolved);
            return apiResponse_1.ApiResponse.success(res, data, 'Notifications retrieved successfully');
        }
        catch (error) {
            next(error);
        }
    }
    async markAsRead(req, res, next) {
        try {
            const orgId = req.user.organization_id;
            const data = await notifications_service_1.notificationsService.markAsRead(orgId, req.params.id);
            return apiResponse_1.ApiResponse.success(res, data, 'Notification marked as read');
        }
        catch (error) {
            next(error);
        }
    }
    async markAsResolved(req, res, next) {
        try {
            const orgId = req.user.organization_id;
            const userId = req.user.id;
            const data = await notifications_service_1.notificationsService.markAsResolved(orgId, req.params.id, userId);
            return apiResponse_1.ApiResponse.success(res, data, 'Notification marked as resolved');
        }
        catch (error) {
            next(error);
        }
    }
    async markAllAsRead(req, res, next) {
        try {
            const orgId = req.user.organization_id;
            const data = await notifications_service_1.notificationsService.markAllAsRead(orgId, req.user.id);
            return apiResponse_1.ApiResponse.success(res, data, 'All notifications marked as read');
        }
        catch (error) {
            next(error);
        }
    }
    async triggerExpiryCheck(req, res, next) {
        try {
            const orgId = req.user.organization_id;
            await notifications_service_1.notificationsService.evaluateExpiryAlerts(orgId);
            return apiResponse_1.ApiResponse.success(res, { message: 'Expiry evaluation completed' }, 'Batch expiry check executed');
        }
        catch (error) {
            next(error);
        }
    }
}
exports.NotificationsController = NotificationsController;
exports.notificationsController = new NotificationsController();
//# sourceMappingURL=notifications.controller.js.map