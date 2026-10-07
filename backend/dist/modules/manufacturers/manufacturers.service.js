"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.manufacturersService = exports.ManufacturersService = void 0;
const connection_1 = require("../../database/connection");
const errors_1 = require("../../common/errors");
class ManufacturersService {
    async listManufacturers(organizationId) {
        const res = await connection_1.db.query('SELECT * FROM manufacturers WHERE organization_id = $1 ORDER BY name ASC', [organizationId]);
        return res.rows;
    }
    async getManufacturerById(organizationId, id) {
        const res = await connection_1.db.query('SELECT * FROM manufacturers WHERE organization_id = $1 AND id = $2', [organizationId, id]);
        if (res.rows.length === 0)
            throw new errors_1.NotFoundError('Manufacturer not found');
        return res.rows[0];
    }
    async createManufacturer(organizationId, data) {
        const res = await connection_1.db.query(`INSERT INTO manufacturers (organization_id, name, country, contact_email, contact_phone)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`, [organizationId, data.name, data.country || null, data.contact_email || null, data.contact_phone || null]);
        return res.rows[0];
    }
    async updateManufacturer(organizationId, id, data) {
        const res = await connection_1.db.query(`UPDATE manufacturers
       SET name = COALESCE($1, name),
           country = COALESCE($2, country),
           contact_email = COALESCE($3, contact_email),
           contact_phone = COALESCE($4, contact_phone),
           is_active = COALESCE($5, is_active),
           updated_at = CURRENT_TIMESTAMP
       WHERE organization_id = $6 AND id = $7
       RETURNING *`, [data.name, data.country, data.contact_email, data.contact_phone, data.is_active, organizationId, id]);
        if (res.rows.length === 0)
            throw new errors_1.NotFoundError('Manufacturer not found');
        return res.rows[0];
    }
}
exports.ManufacturersService = ManufacturersService;
exports.manufacturersService = new ManufacturersService();
//# sourceMappingURL=manufacturers.service.js.map