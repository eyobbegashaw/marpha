"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.manufacturersController = exports.ManufacturersController = void 0;
const manufacturers_service_1 = require("./manufacturers.service");
const apiResponse_1 = require("../../common/utils/apiResponse");
class ManufacturersController {
    async list(req, res, next) {
        try {
            const orgId = req.user.organization_id;
            const data = await manufacturers_service_1.manufacturersService.listManufacturers(orgId);
            return apiResponse_1.ApiResponse.success(res, data, 'Manufacturers retrieved successfully');
        }
        catch (error) {
            next(error);
        }
    }
    async getById(req, res, next) {
        try {
            const orgId = req.user.organization_id;
            const data = await manufacturers_service_1.manufacturersService.getManufacturerById(orgId, req.params.id);
            return apiResponse_1.ApiResponse.success(res, data, 'Manufacturer retrieved successfully');
        }
        catch (error) {
            next(error);
        }
    }
    async create(req, res, next) {
        try {
            const orgId = req.user.organization_id;
            const data = await manufacturers_service_1.manufacturersService.createManufacturer(orgId, req.body);
            return apiResponse_1.ApiResponse.created(res, data, 'Manufacturer created successfully');
        }
        catch (error) {
            next(error);
        }
    }
    async update(req, res, next) {
        try {
            const orgId = req.user.organization_id;
            const data = await manufacturers_service_1.manufacturersService.updateManufacturer(orgId, req.params.id, req.body);
            return apiResponse_1.ApiResponse.success(res, data, 'Manufacturer updated successfully');
        }
        catch (error) {
            next(error);
        }
    }
}
exports.ManufacturersController = ManufacturersController;
exports.manufacturersController = new ManufacturersController();
//# sourceMappingURL=manufacturers.controller.js.map