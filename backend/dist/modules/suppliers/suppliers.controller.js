"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.suppliersController = exports.SuppliersController = void 0;
const suppliers_service_1 = require("./suppliers.service");
const apiResponse_1 = require("../../common/utils/apiResponse");
class SuppliersController {
    async list(req, res, next) {
        try {
            const orgId = req.user.organization_id;
            const data = await suppliers_service_1.suppliersService.listSuppliers(orgId);
            return apiResponse_1.ApiResponse.success(res, data, 'Suppliers retrieved successfully');
        }
        catch (error) {
            next(error);
        }
    }
    async getById(req, res, next) {
        try {
            const orgId = req.user.organization_id;
            const data = await suppliers_service_1.suppliersService.getSupplierById(orgId, req.params.id);
            return apiResponse_1.ApiResponse.success(res, data, 'Supplier retrieved successfully');
        }
        catch (error) {
            next(error);
        }
    }
    async create(req, res, next) {
        try {
            const orgId = req.user.organization_id;
            const data = await suppliers_service_1.suppliersService.createSupplier(orgId, req.body);
            return apiResponse_1.ApiResponse.created(res, data, 'Supplier created successfully');
        }
        catch (error) {
            next(error);
        }
    }
    async update(req, res, next) {
        try {
            const orgId = req.user.organization_id;
            const data = await suppliers_service_1.suppliersService.updateSupplier(orgId, req.params.id, req.body);
            return apiResponse_1.ApiResponse.success(res, data, 'Supplier updated successfully');
        }
        catch (error) {
            next(error);
        }
    }
}
exports.SuppliersController = SuppliersController;
exports.suppliersController = new SuppliersController();
//# sourceMappingURL=suppliers.controller.js.map