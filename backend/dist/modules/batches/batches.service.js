"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.batchesService = exports.BatchesService = void 0;
const connection_1 = require("../../database/connection");
const errors_1 = require("../../common/errors");
class BatchesService {
    async listBatches(organizationId, filters) {
        let query = `
      SELECT pb.*, p.generic_name, p.brand_name, p.strength, p.dosage_form,
             s.name AS supplier_name,
             COALESCE(SUM(i.quantity), 0) AS current_stock
      FROM product_batches pb
      JOIN products p ON pb.product_id = p.id
      LEFT JOIN suppliers s ON pb.supplier_id = s.id
      LEFT JOIN inventory i ON pb.id = i.batch_id
      WHERE pb.organization_id = $1
    `;
        const params = [organizationId];
        if (filters.productId) {
            params.push(filters.productId);
            query += ` AND pb.product_id = $${params.length}`;
        }
        if (filters.isQuarantined !== undefined) {
            params.push(filters.isQuarantined);
            query += ` AND pb.is_quarantined = $${params.length}`;
        }
        if (filters.expiringBefore) {
            params.push(filters.expiringBefore);
            query += ` AND pb.expiry_date <= $${params.length}`;
        }
        query += `
      GROUP BY pb.id, p.generic_name, p.brand_name, p.strength, p.dosage_form, s.name
      ORDER BY pb.expiry_date ASC
    `;
        const res = await connection_1.db.query(query, params);
        return res.rows;
    }
    async getBatchById(organizationId, batchId) {
        const res = await connection_1.db.query(`SELECT pb.*, p.generic_name, p.brand_name, p.strength, p.dosage_form,
              s.name AS supplier_name,
              COALESCE(SUM(i.quantity), 0) AS current_stock
       FROM product_batches pb
       JOIN products p ON pb.product_id = p.id
       LEFT JOIN suppliers s ON pb.supplier_id = s.id
       LEFT JOIN inventory i ON pb.id = i.batch_id
       WHERE pb.organization_id = $1 AND pb.id = $2
       GROUP BY pb.id, p.generic_name, p.brand_name, p.strength, p.dosage_form, s.name`, [organizationId, batchId]);
        if (res.rows.length === 0)
            throw new errors_1.NotFoundError('Batch not found');
        return res.rows[0];
    }
    async createBatch(organizationId, data) {
        // Check if batch number exists for product
        const existing = await connection_1.db.query('SELECT id FROM product_batches WHERE product_id = $1 AND batch_number = $2', [data.productId, data.batchNumber]);
        if (existing.rows.length > 0) {
            throw new errors_1.ConflictError(`Batch number '${data.batchNumber}' already exists for this medicine`);
        }
        const res = await connection_1.db.query(`INSERT INTO product_batches (organization_id, product_id, supplier_id, batch_number, manufacturing_date, expiry_date, purchase_cost, selling_price, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`, [
            organizationId,
            data.productId,
            data.supplierId || null,
            data.batchNumber,
            data.manufacturingDate || null,
            data.expiryDate,
            data.purchaseCost,
            data.sellingPrice,
            data.notes || null,
        ]);
        return res.rows[0];
    }
    async updateQuarantine(organizationId, batchId, isQuarantined, notes) {
        const res = await connection_1.db.query(`UPDATE product_batches
       SET is_quarantined = $1,
           notes = COALESCE($2, notes),
           updated_at = CURRENT_TIMESTAMP
       WHERE organization_id = $3 AND id = $4
       RETURNING *`, [isQuarantined, notes, organizationId, batchId]);
        if (res.rows.length === 0)
            throw new errors_1.NotFoundError('Batch not found');
        return res.rows[0];
    }
}
exports.BatchesService = BatchesService;
exports.batchesService = new BatchesService();
//# sourceMappingURL=batches.service.js.map