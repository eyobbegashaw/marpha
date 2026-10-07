"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.categoriesController = exports.CategoriesController = void 0;
const categories_service_1 = require("./categories.service");
const apiResponse_1 = require("../../common/utils/apiResponse");
const connection_1 = require("../../database/connection");
async function resolveOrgId(req) {
    if (req.user?.organization_id)
        return req.user.organization_id;
    if (req.query.organizationId)
        return req.query.organizationId;
    const res = await connection_1.db.query('SELECT id FROM organizations WHERE is_active = TRUE LIMIT 1');
    return res.rows[0]?.id;
}
class CategoriesController {
    async list(req, res, next) {
        try {
            const orgId = await resolveOrgId(req);
            const categories = await categories_service_1.categoriesService.listCategories(orgId);
            return apiResponse_1.ApiResponse.success(res, categories, 'Categories retrieved successfully');
        }
        catch (error) {
            next(error);
        }
    }
    async getById(req, res, next) {
        try {
            const orgId = await resolveOrgId(req);
            const category = await categories_service_1.categoriesService.getCategoryById(orgId, req.params.id);
            return apiResponse_1.ApiResponse.success(res, category, 'Category retrieved successfully');
        }
        catch (error) {
            next(error);
        }
    }
    async create(req, res, next) {
        try {
            const orgId = req.user.organization_id;
            const category = await categories_service_1.categoriesService.createCategory(orgId, req.body);
            return apiResponse_1.ApiResponse.created(res, category, 'Category created successfully');
        }
        catch (error) {
            next(error);
        }
    }
    async update(req, res, next) {
        try {
            const orgId = req.user.organization_id;
            const category = await categories_service_1.categoriesService.updateCategory(orgId, req.params.id, req.body);
            return apiResponse_1.ApiResponse.success(res, category, 'Category updated successfully');
        }
        catch (error) {
            next(error);
        }
    }
}
exports.CategoriesController = CategoriesController;
exports.categoriesController = new CategoriesController();
//# sourceMappingURL=categories.controller.js.map