"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.suppliersService = exports.SuppliersService = void 0;
const connection_1 = require("../../database/connection");
const errors_1 = require("../../common/errors");
class SuppliersService {
    async listSuppliers(organizationId) {
        const res = await connection_1.db.query('SELECT * FROM suppliers WHERE organization_id = $1 ORDER BY name ASC', [organizationId]);
        return res.rows;
    }
    async getSupplierById(organizationId, id) {
        const res = await connection_1.db.query('SELECT * FROM suppliers WHERE organization_id = $1 AND id = $2', [organizationId, id]);
        if (res.rows.length === 0)
            throw new errors_1.NotFoundError('Supplier not found');
        return res.rows[0];
    }
    async createSupplier(organizationId, data) {
        const res = await connection_1.db.query(`INSERT INTO suppliers (organization_id, name, contact_person, email, phone, address, lead_time_days, payment_terms)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`, [
            organizationId,
            data.name,
            data.contact_person || null,
            data.email || null,
            data.phone || null,
            data.address || null,
            data.lead_time_days ?? 7,
            data.payment_terms || null,
        ]);
        return res.rows[0];
    }
    async updateSupplier(organizationId, id, data) {
        const res = await connection_1.db.query(`UPDATE suppliers
       SET name = COALESCE($1, name),
           contact_person = COALESCE($2, contact_person),
           email = COALESCE($3, email),
           phone = COALESCE($4, phone),
           address = COALESCE($5, address),
           lead_time_days = COALESCE($6, lead_time_days),
           payment_terms = COALESCE($7, payment_terms),
           is_active = COALESCE($8, is_active),
           updated_at = CURRENT_TIMESTAMP
       WHERE organization_id = $9 AND id = $10
       RETURNING *`, [
            data.name,
            data.contact_person,
            data.email,
            data.phone,
            data.address,
            data.lead_time_days,
            data.payment_terms,
            data.is_active,
            organizationId,
            id,
        ]);
        if (res.rows.length === 0)
            throw new errors_1.NotFoundError('Supplier not found');
        return res.rows[0];
    }
}
exports.SuppliersService = SuppliersService;
exports.suppliersService = new SuppliersService();
//# sourceMappingURL=suppliers.service.js.map