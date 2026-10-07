"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.categoriesService = exports.CategoriesService = void 0;
const connection_1 = require("../../database/connection");
const errors_1 = require("../../common/errors");
class CategoriesService {
    async listCategories(organizationId) {
        const res = await connection_1.db.query('SELECT * FROM categories WHERE organization_id = $1 ORDER BY name_en ASC', [organizationId]);
        return res.rows;
    }
    async getCategoryById(organizationId, categoryId) {
        const res = await connection_1.db.query('SELECT * FROM categories WHERE organization_id = $1 AND id = $2', [organizationId, categoryId]);
        if (res.rows.length === 0)
            throw new errors_1.NotFoundError('Category not found');
        return res.rows[0];
    }
    async createCategory(organizationId, data) {
        const res = await connection_1.db.query(`INSERT INTO categories (organization_id, name_en, name_am, description)
       VALUES ($1, $2, $3, $4)
       RETURNING *`, [organizationId, data.name_en, data.name_am || null, data.description || null]);
        return res.rows[0];
    }
    async updateCategory(organizationId, categoryId, data) {
        const res = await connection_1.db.query(`UPDATE categories
       SET name_en = COALESCE($1, name_en),
           name_am = COALESCE($2, name_am),
           description = COALESCE($3, description),
           is_active = COALESCE($4, is_active),
           updated_at = CURRENT_TIMESTAMP
       WHERE organization_id = $5 AND id = $6
       RETURNING *`, [data.name_en, data.name_am, data.description, data.isActive, organizationId, categoryId]);
        if (res.rows.length === 0)
            throw new errors_1.NotFoundError('Category not found');
        return res.rows[0];
    }
}
exports.CategoriesService = CategoriesService;
exports.categoriesService = new CategoriesService();
//# sourceMappingURL=categories.service.js.map