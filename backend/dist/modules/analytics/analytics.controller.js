"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsController = exports.AnalyticsController = void 0;
const analytics_service_1 = require("./analytics.service");
const apiResponse_1 = require("../../common/utils/apiResponse");
class AnalyticsController {
    async getDashboard(req, res, next) {
        try {
            const orgId = req.user.organization_id;
            const branchId = req.query.branchId || undefined;
            const period = req.query.period || 'today';
            const customStart = req.query.startDate;
            const customEnd = req.query.endDate;
            const data = await analytics_service_1.analyticsService.getDashboardSummary(orgId, branchId, period, customStart, customEnd);
            return apiResponse_1.ApiResponse.success(res, data, 'Analytics dashboard summary retrieved');
        }
        catch (error) {
            next(error);
        }
    }
    async getTopSelling(req, res, next) {
        try {
            const orgId = req.user.organization_id;
            const branchId = req.query.branchId || undefined;
            const period = req.query.period || '30days';
            const limit = req.query.limit ? parseInt(req.query.limit, 10) : 10;
            const customStart = req.query.startDate;
            const customEnd = req.query.endDate;
            const data = await analytics_service_1.analyticsService.getTopSellingMedicines(orgId, branchId, period, limit, customStart, customEnd);
            return apiResponse_1.ApiResponse.success(res, data, 'Top selling medicines retrieved');
        }
        catch (error) {
            next(error);
        }
    }
    async getCategorySales(req, res, next) {
        try {
            const orgId = req.user.organization_id;
            const branchId = req.query.branchId || undefined;
            const period = req.query.period || '30days';
            const customStart = req.query.startDate;
            const customEnd = req.query.endDate;
            const data = await analytics_service_1.analyticsService.getCategorySales(orgId, branchId, period, customStart, customEnd);
            return apiResponse_1.ApiResponse.success(res, data, 'Sales by category retrieved');
        }
        catch (error) {
            next(error);
        }
    }
    async getDemandRecommendations(req, res, next) {
        try {
            const orgId = req.user.organization_id;
            const branchId = req.query.branchId || undefined;
            const data = await analytics_service_1.analyticsService.getDemandAndReorderRecommendations(orgId, branchId);
            return apiResponse_1.ApiResponse.success(res, data, 'Demand restock recommendations retrieved');
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AnalyticsController = AnalyticsController;
exports.analyticsController = new AnalyticsController();
//# sourceMappingURL=analytics.controller.js.map