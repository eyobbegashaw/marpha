"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.customersController = exports.CustomersController = void 0;
const customers_service_1 = require("./customers.service");
const apiResponse_1 = require("../../common/utils/apiResponse");
class CustomersController {
    async list(req, res, next) {
        try {
            const orgId = req.user.organization_id;
            const search = req.query.search;
            const customers = await customers_service_1.customersService.listCustomers(orgId, search);
            return apiResponse_1.ApiResponse.success(res, customers, 'Customers retrieved successfully');
        }
        catch (error) {
            next(error);
        }
    }
    async getById(req, res, next) {
        try {
            const orgId = req.user.organization_id;
            const customer = await customers_service_1.customersService.getCustomerById(orgId, req.params.id);
            return apiResponse_1.ApiResponse.success(res, customer, 'Customer retrieved successfully');
        }
        catch (error) {
            next(error);
        }
    }
    async create(req, res, next) {
        try {
            const orgId = req.user.organization_id;
            const customer = await customers_service_1.customersService.createCustomer(orgId, req.body);
            return apiResponse_1.ApiResponse.created(res, customer, 'Customer created successfully');
        }
        catch (error) {
            next(error);
        }
    }
    async update(req, res, next) {
        try {
            const orgId = req.user.organization_id;
            const customer = await customers_service_1.customersService.updateCustomer(orgId, req.params.id, req.body);
            return apiResponse_1.ApiResponse.success(res, customer, 'Customer updated successfully');
        }
        catch (error) {
            next(error);
        }
    }
}
exports.CustomersController = CustomersController;
exports.customersController = new CustomersController();
//# sourceMappingURL=customers.controller.js.map