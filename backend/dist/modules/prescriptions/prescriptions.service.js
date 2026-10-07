"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prescriptionsService = exports.PrescriptionsService = void 0;
const connection_1 = require("../../database/connection");
const errors_1 = require("../../common/errors");
class PrescriptionsService {
    async listPrescriptions(organizationId, branchId, customerId, status) {
        let query = `
      SELECT pr.*, c.first_name || ' ' || c.last_name AS customer_name, c.phone AS customer_phone,
             u.first_name || ' ' || u.last_name AS created_by_name,
             COUNT(pi.id) AS total_items
      FROM prescriptions pr
      LEFT JOIN customers c ON pr.customer_id = c.id
      JOIN users u ON pr.created_by = u.id
      LEFT JOIN prescription_items pi ON pr.id = pi.prescription_id
      WHERE pr.organization_id = $1
    `;
        const params = [organizationId];
        if (branchId) {
            params.push(branchId);
            query += ` AND pr.branch_id = $${params.length}`;
        }
        if (customerId) {
            params.push(customerId);
            query += ` AND pr.customer_id = $${params.length}`;
        }
        if (status) {
            params.push(status);
            query += ` AND pr.status = $${params.length}`;
        }
        query += `
      GROUP BY pr.id, c.first_name, c.last_name, c.phone, u.first_name, u.last_name
      ORDER BY pr.prescription_date DESC, pr.created_at DESC
    `;
        const res = await connection_1.db.query(query, params);
        return res.rows;
    }
    async getPrescriptionById(organizationId, prescriptionId) {
        const res = await connection_1.db.query(`SELECT pr.*, c.first_name || ' ' || c.last_name AS customer_name, c.phone AS customer_phone,
              c.allergies, c.chronic_conditions,
              u.first_name || ' ' || u.last_name AS created_by_name
       FROM prescriptions pr
       LEFT JOIN customers c ON pr.customer_id = c.id
       JOIN users u ON pr.created_by = u.id
       WHERE pr.organization_id = $1 AND pr.id = $2`, [organizationId, prescriptionId]);
        if (res.rows.length === 0)
            throw new errors_1.NotFoundError('Prescription not found');
        const prescription = res.rows[0];
        const itemsRes = await connection_1.db.query(`SELECT pi.*, p.generic_name, p.brand_name, p.strength, p.dosage_form
       FROM prescription_items pi
       JOIN products p ON pi.product_id = p.id
       WHERE pi.prescription_id = $1`, [prescriptionId]);
        return {
            ...prescription,
            items: itemsRes.rows,
        };
    }
    async createPrescription(organizationId, userId, data) {
        return await connection_1.db.withTransaction(async (client) => {
            const prRes = await client.query(`INSERT INTO prescriptions (
          organization_id, branch_id, customer_id, doctor_name, doctor_phone,
          hospital_clinic, diagnosis, prescription_date, notes, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, COALESCE($8, CURRENT_DATE), $9, $10)
        RETURNING *`, [
                organizationId,
                data.branchId,
                data.customerId || null,
                data.doctorName,
                data.doctorPhone || null,
                data.hospitalClinic || null,
                data.diagnosis || null,
                data.prescriptionDate || null,
                data.notes || null,
                userId,
            ]);
            const prescription = prRes.rows[0];
            for (const item of data.items) {
                await client.query(`INSERT INTO prescription_items (
            prescription_id, product_id, dosage, frequency, duration, quantity_prescribed, instructions
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)`, [
                    prescription.id,
                    item.productId,
                    item.dosage,
                    item.frequency,
                    item.duration,
                    item.quantityPrescribed,
                    item.instructions || null,
                ]);
            }
            return prescription;
        });
    }
}
exports.PrescriptionsService = PrescriptionsService;
exports.prescriptionsService = new PrescriptionsService();
//# sourceMappingURL=prescriptions.service.js.map