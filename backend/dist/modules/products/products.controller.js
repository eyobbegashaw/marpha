"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productsController = exports.ProductsController = void 0;
const products_service_1 = require("./products.service");
const apiResponse_1 = require("../../common/utils/apiResponse");
const auditLoggerMiddleware_1 = require("../../common/middlewares/auditLoggerMiddleware");
const connection_1 = require("../../database/connection");
async function resolveOrgId(req) {
    if (req.user?.organization_id)
        return req.user.organization_id;
    if (req.query.organizationId)
        return req.query.organizationId;
    const res = await connection_1.db.query('SELECT id FROM organizations WHERE is_active = TRUE LIMIT 1');
    return res.rows[0]?.id;
}
class ProductsController {
    async list(req, res, next) {
        try {
            const orgId = await resolveOrgId(req);
            const filters = {
                search: req.query.search,
                categoryId: req.query.categoryId,
                manufacturerId: req.query.manufacturerId,
                prescriptionRequired: req.query.prescriptionRequired !== undefined ? req.query.prescriptionRequired === 'true' : undefined,
                isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : true,
                limit: req.query.limit ? parseInt(req.query.limit, 10) : undefined,
                offset: req.query.offset ? parseInt(req.query.offset, 10) : undefined,
            };
            const products = await products_service_1.productsService.listProducts(orgId, filters);
            return apiResponse_1.ApiResponse.success(res, products, 'Medicines retrieved successfully');
        }
        catch (error) {
            next(error);
        }
    }
    async getById(req, res, next) {
        try {
            const orgId = await resolveOrgId(req);
            const isStaff = req.user?.role === 'PHARMACY_OWNER' || req.user?.role === 'PHARMACIST';
            const product = await products_service_1.productsService.getProductById(orgId, req.params.id, isStaff);
            return apiResponse_1.ApiResponse.success(res, product, 'Medicine retrieved successfully');
        }
        catch (error) {
            next(error);
        }
    }
    async getAvailability(req, res, next) {
        try {
            const orgId = await resolveOrgId(req);
            const branchId = req.query.branchId;
            const data = await products_service_1.productsService.getProductRealTimeAvailability(orgId, req.params.id, branchId);
            return apiResponse_1.ApiResponse.success(res, data, 'Real-time stock availability retrieved');
        }
        catch (error) {
            next(error);
        }
    }
    async getByBarcode(req, res, next) {
        try {
            const orgId = await resolveOrgId(req);
            const product = await products_service_1.productsService.getProductByBarcode(orgId, req.params.barcode);
            return apiResponse_1.ApiResponse.success(res, product, 'Medicine found');
        }
        catch (error) {
            next(error);
        }
    }
    async create(req, res, next) {
        try {
            const orgId = req.user.organization_id;
            const product = await products_service_1.productsService.createProduct(orgId, req.body);
            await (0, auditLoggerMiddleware_1.logAuditEvent)(req, 'CREATE_PRODUCT', 'products', product.id, { genericName: product.generic_name, sku: product.sku });
            return apiResponse_1.ApiResponse.created(res, product, 'Medicine created successfully');
        }
        catch (error) {
            next(error);
        }
    }
    async update(req, res, next) {
        try {
            const orgId = req.user.organization_id;
            const product = await products_service_1.productsService.updateProduct(orgId, req.params.id, req.body);
            await (0, auditLoggerMiddleware_1.logAuditEvent)(req, 'UPDATE_PRODUCT', 'products', product.id, req.body);
            return apiResponse_1.ApiResponse.success(res, product, 'Medicine updated successfully');
        }
        catch (error) {
            next(error);
        }
    }
    async updateStatus(req, res, next) {
        try {
            const orgId = req.user.organization_id;
            const { isActive } = req.body;
            const product = await products_service_1.productsService.updateProductStatus(orgId, req.params.id, isActive);
            await (0, auditLoggerMiddleware_1.logAuditEvent)(req, isActive ? 'ACTIVATE_PRODUCT' : 'DEACTIVATE_PRODUCT', 'products', product.id, { isActive });
            return apiResponse_1.ApiResponse.success(res, product, `Medicine ${isActive ? 'activated' : 'deactivated'} successfully`);
        }
        catch (error) {
            next(error);
        }
    }
    async updatePrice(req, res, next) {
        try {
            const orgId = req.user.organization_id;
            const userId = req.user.id;
            const { sellingPrice, reason } = req.body;
            const result = await products_service_1.productsService.updateProductPrice(orgId, req.params.id, sellingPrice, reason, userId);
            await (0, auditLoggerMiddleware_1.logAuditEvent)(req, 'UPDATE_PRODUCT_PRICE', 'products', req.params.id, { oldPrice: result.oldPrice, newPrice: result.newPrice, reason });
            return apiResponse_1.ApiResponse.success(res, result, result.message);
        }
        catch (error) {
            next(error);
        }
    }
    async getPriceHistory(req, res, next) {
        try {
            const orgId = req.user.organization_id;
            const history = await products_service_1.productsService.getPriceHistory(orgId, req.params.id);
            return apiResponse_1.ApiResponse.success(res, history, 'Price history retrieved successfully');
        }
        catch (error) {
            next(error);
        }
    }
}
exports.ProductsController = ProductsController;
exports.productsController = new ProductsController();
//# sourceMappingURL=products.controller.js.map