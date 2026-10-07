"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.customersService = exports.CustomersService = void 0;
const connection_1 = require("../../database/connection");
const errors_1 = require("../../common/errors");
class CustomersService {
    async listCustomers(organizationId, search) {
        let query = `SELECT * FROM customers WHERE organization_id = $1`;
        const params = [organizationId];
        if (search) {
            params.push(`%${search.toLowerCase()}%`);
            query += ` AND (LOWER(first_name) LIKE $${params.length} OR LOWER(last_name) LIKE $${params.length} OR phone LIKE $${params.length})`;
        }
        query += ` ORDER BY first_name ASC`;
        const res = await connection_1.db.query(query, params);
        return res.rows;
    }
    async getCustomerById(organizationId, customerId) {
        const res = await connection_1.db.query('SELECT * FROM customers WHERE organization_id = $1 AND id = $2', [organizationId, customerId]);
        if (res.rows.length === 0)
            throw new errors_1.NotFoundError('Customer not found');
        // Get customer's past purchases/prescriptions
        const salesRes = await connection_1.db.query(`SELECT id, invoice_number, sale_date, total_amount, payment_status
       FROM sales
       WHERE organization_id = $1 AND customer_id = $2
       ORDER BY sale_date DESC LIMIT 10`, [organizationId, customerId]);
        const prescriptionsRes = await connection_1.db.query(`SELECT id, doctor_name, hospital_clinic, prescription_date, status
       FROM prescriptions
       WHERE organization_id = $1 AND customer_id = $2
       ORDER BY prescription_date DESC LIMIT 10`, [organizationId, customerId]);
        return {
            ...res.rows[0],
            recentSales: salesRes.rows,
            prescriptions: prescriptionsRes.rows,
        };
    }
    async createCustomer(organizationId, data) {
        const res = await connection_1.db.query(`INSERT INTO customers (organization_id, first_name, last_name, phone, email, address, date_of_birth, gender, allergies, chronic_conditions)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`, [
            organizationId,
            data.firstName,
            data.lastName,
            data.phone || null,
            data.email || null,
            data.address || null,
            data.dateOfBirth || null,
            data.gender || null,
            data.allergies || null,
            data.chronicConditions || null,
        ]);
        return res.rows[0];
    }
    async updateCustomer(organizationId, customerId, data) {
        const res = await connection_1.db.query(`UPDATE customers
       SET first_name = COALESCE($1, first_name),
           last_name = COALESCE($2, last_name),
           phone = COALESCE($3, phone),
           email = COALESCE($4, email),
           address = COALESCE($5, address),
           date_of_birth = COALESCE($6, date_of_birth),
           gender = COALESCE($7, gender),
           allergies = COALESCE($8, allergies),
           chronic_conditions = COALESCE($9, chronic_conditions),
           is_active = COALESCE($10, is_active),
           updated_at = CURRENT_TIMESTAMP
       WHERE organization_id = $11 AND id = $12
       RETURNING *`, [
            data.firstName,
            data.lastName,
            data.phone,
            data.email,
            data.address,
            data.dateOfBirth,
            data.gender,
            data.allergies,
            data.chronicConditions,
            data.isActive,
            organizationId,
            customerId,
        ]);
        if (res.rows.length === 0)
            throw new errors_1.NotFoundError('Customer not found');
        return res.rows[0];
    }
}
exports.CustomersService = CustomersService;
exports.customersService = new CustomersService();
//# sourceMappingURL=customers.service.js.map