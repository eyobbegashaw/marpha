import { db } from '../../database/connection';
import { NotFoundError } from '../../common/errors';

export class CategoriesService {
  async listCategories(organizationId: string) {
    const res = await db.query(
      'SELECT * FROM categories WHERE organization_id = $1 ORDER BY name_en ASC',
      [organizationId]
    );
    return res.rows;
  }

  async getCategoryById(organizationId: string, categoryId: string) {
    const res = await db.query(
      'SELECT * FROM categories WHERE organization_id = $1 AND id = $2',
      [organizationId, categoryId]
    );
    if (res.rows.length === 0) throw new NotFoundError('Category not found');
    return res.rows[0];
  }

  async createCategory(organizationId: string, data: { name_en: string; name_am?: string; description?: string }) {
    const res = await db.query(
      `INSERT INTO categories (organization_id, name_en, name_am, description)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [organizationId, data.name_en, data.name_am || null, data.description || null]
    );
    return res.rows[0];
  }

  async updateCategory(organizationId: string, categoryId: string, data: { name_en?: string; name_am?: string; description?: string; isActive?: boolean }) {
    const res = await db.query(
      `UPDATE categories
       SET name_en = COALESCE($1, name_en),
           name_am = COALESCE($2, name_am),
           description = COALESCE($3, description),
           is_active = COALESCE($4, is_active),
           updated_at = CURRENT_TIMESTAMP
       WHERE organization_id = $5 AND id = $6
       RETURNING *`,
      [data.name_en, data.name_am, data.description, data.isActive, organizationId, categoryId]
    );
    if (res.rows.length === 0) throw new NotFoundError('Category not found');
    return res.rows[0];
  }
}

export const categoriesService = new CategoriesService();
