"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.locationsService = exports.LocationsService = void 0;
const connection_1 = require("../../database/connection");
const errors_1 = require("../../common/errors");
class LocationsService {
    async listLocations(organizationId, branchId, locationType) {
        let query = `
      SELECT l.*, b.name AS branch_name
      FROM locations l
      JOIN branches b ON l.branch_id = b.id
      WHERE l.organization_id = $1
    `;
        const params = [organizationId];
        if (branchId) {
            params.push(branchId);
            query += ` AND l.branch_id = $${params.length}`;
        }
        if (locationType) {
            params.push(locationType);
            query += ` AND l.location_type = $${params.length}`;
        }
        query += ` ORDER BY l.location_type ASC, l.name ASC`;
        const res = await connection_1.db.query(query, params);
        return res.rows;
    }
    async getLocationById(organizationId, locationId) {
        const res = await connection_1.db.query(`SELECT l.*, b.name AS branch_name
       FROM locations l
       JOIN branches b ON l.branch_id = b.id
       WHERE l.organization_id = $1 AND l.id = $2`, [organizationId, locationId]);
        if (res.rows.length === 0)
            throw new errors_1.NotFoundError('Location not found');
        return res.rows[0];
    }
    async createLocation(organizationId, data) {
        const res = await connection_1.db.query(`INSERT INTO locations (organization_id, branch_id, name, code, location_type, is_sales_point, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`, [
            organizationId,
            data.branchId,
            data.name,
            data.code.toUpperCase(),
            data.locationType,
            data.isSalesPoint || data.locationType === 'SALES_SHELF',
            data.description || null,
        ]);
        return res.rows[0];
    }
    async updateLocation(organizationId, locationId, data) {
        const res = await connection_1.db.query(`UPDATE locations
       SET name = COALESCE($1, name),
           is_sales_point = COALESCE($2, is_sales_point),
           description = COALESCE($3, description),
           is_active = COALESCE($4, is_active),
           updated_at = CURRENT_TIMESTAMP
       WHERE organization_id = $5 AND id = $6
       RETURNING *`, [data.name, data.isSalesPoint, data.description, data.isActive, organizationId, locationId]);
        if (res.rows.length === 0)
            throw new errors_1.NotFoundError('Location not found');
        return res.rows[0];
    }
}
exports.LocationsService = LocationsService;
exports.locationsService = new LocationsService();
//# sourceMappingURL=locations.service.js.map