import { db } from '../../database/connection';
import { NotFoundError } from '../../common/errors';

export class LocationsService {
  async listLocations(organizationId: string, branchId?: string, locationType?: string) {
    let query = `
      SELECT l.*, b.name AS branch_name
      FROM locations l
      JOIN branches b ON l.branch_id = b.id
      WHERE l.organization_id = $1
    `;
    const params: any[] = [organizationId];

    if (branchId) {
      params.push(branchId);
      query += ` AND l.branch_id = $${params.length}`;
    }

    if (locationType) {
      params.push(locationType);
      query += ` AND l.location_type = $${params.length}`;
    }

    query += ` ORDER BY l.location_type ASC, l.name ASC`;
    const res = await db.query(query, params);
    return res.rows;
  }

  async getLocationById(organizationId: string, locationId: string) {
    const res = await db.query(
      `SELECT l.*, b.name AS branch_name
       FROM locations l
       JOIN branches b ON l.branch_id = b.id
       WHERE l.organization_id = $1 AND l.id = $2`,
      [organizationId, locationId]
    );
    if (res.rows.length === 0) throw new NotFoundError('Location not found');
    return res.rows[0];
  }

  async createLocation(organizationId: string, data: {
    branchId: string;
    name: string;
    code: string;
    locationType: 'SALES_SHELF' | 'WAREHOUSE' | 'DISPENSARY' | 'QUARANTINE' | 'DAMAGED_STORAGE';
    isSalesPoint?: boolean;
    description?: string;
  }) {
    const res = await db.query(
      `INSERT INTO locations (organization_id, branch_id, name, code, location_type, is_sales_point, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        organizationId,
        data.branchId,
        data.name,
        data.code.toUpperCase(),
        data.locationType,
        data.isSalesPoint || data.locationType === 'SALES_SHELF',
        data.description || null,
      ]
    );
    return res.rows[0];
  }

  async updateLocation(organizationId: string, locationId: string, data: {
    name?: string;
    isSalesPoint?: boolean;
    description?: string;
    isActive?: boolean;
  }) {
    const res = await db.query(
      `UPDATE locations
       SET name = COALESCE($1, name),
           is_sales_point = COALESCE($2, is_sales_point),
           description = COALESCE($3, description),
           is_active = COALESCE($4, is_active),
           updated_at = CURRENT_TIMESTAMP
       WHERE organization_id = $5 AND id = $6
       RETURNING *`,
      [data.name, data.isSalesPoint, data.description, data.isActive, organizationId, locationId]
    );
    if (res.rows.length === 0) throw new NotFoundError('Location not found');
    return res.rows[0];
  }
}

export const locationsService = new LocationsService();
