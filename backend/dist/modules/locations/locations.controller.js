"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.locationsController = exports.LocationsController = void 0;
const locations_service_1 = require("./locations.service");
const apiResponse_1 = require("../../common/utils/apiResponse");
const auditLoggerMiddleware_1 = require("../../common/middlewares/auditLoggerMiddleware");
class LocationsController {
    async list(req, res, next) {
        try {
            const orgId = req.user.organization_id;
            const branchId = req.query.branchId || req.user?.branch_id || undefined;
            const locationType = req.query.locationType;
            const locations = await locations_service_1.locationsService.listLocations(orgId, branchId, locationType);
            return apiResponse_1.ApiResponse.success(res, locations, 'Locations retrieved successfully');
        }
        catch (error) {
            next(error);
        }
    }
    async getById(req, res, next) {
        try {
            const orgId = req.user.organization_id;
            const location = await locations_service_1.locationsService.getLocationById(orgId, req.params.id);
            return apiResponse_1.ApiResponse.success(res, location, 'Location retrieved successfully');
        }
        catch (error) {
            next(error);
        }
    }
    async create(req, res, next) {
        try {
            const orgId = req.user.organization_id;
            const location = await locations_service_1.locationsService.createLocation(orgId, req.body);
            await (0, auditLoggerMiddleware_1.logAuditEvent)(req, 'CREATE_LOCATION', 'locations', location.id, { name: location.name, code: location.code });
            return apiResponse_1.ApiResponse.created(res, location, 'Location created successfully');
        }
        catch (error) {
            next(error);
        }
    }
    async update(req, res, next) {
        try {
            const orgId = req.user.organization_id;
            const location = await locations_service_1.locationsService.updateLocation(orgId, req.params.id, req.body);
            await (0, auditLoggerMiddleware_1.logAuditEvent)(req, 'UPDATE_LOCATION', 'locations', location.id, req.body);
            return apiResponse_1.ApiResponse.success(res, location, 'Location updated successfully');
        }
        catch (error) {
            next(error);
        }
    }
}
exports.LocationsController = LocationsController;
exports.locationsController = new LocationsController();
//# sourceMappingURL=locations.controller.js.map