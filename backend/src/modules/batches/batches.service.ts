import { db } from '../../database/connection';
import { NotFoundError, ConflictError } from '../../common/errors';

export class BatchesService {
  async listBatches(organizationId: string, filters: { productId?: string; isQuarantined?: boolean; expiringBefore?: string }) {
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
    const params: any[] = [organizationId];

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

    const res = await db.query(query, params);
    return res.rows;
  }

  async getBatchById(organizationId: string, batchId: string) {
    const res = await db.query(
      `SELECT pb.*, p.generic_name, p.brand_name, p.strength, p.dosage_form,
              s.name AS supplier_name,
              COALESCE(SUM(i.quantity), 0) AS current_stock
       FROM product_batches pb
       JOIN products p ON pb.product_id = p.id
       LEFT JOIN suppliers s ON pb.supplier_id = s.id
       LEFT JOIN inventory i ON pb.id = i.batch_id
       WHERE pb.organization_id = $1 AND pb.id = $2
       GROUP BY pb.id, p.generic_name, p.brand_name, p.strength, p.dosage_form, s.name`,
      [organizationId, batchId]
    );

    if (res.rows.length === 0) throw new NotFoundError('Batch not found');
    return res.rows[0];
  }

  async createBatch(organizationId: string, data: {
    productId: string;
    supplierId?: string;
    batchNumber: string;
    manufacturingDate?: string;
    expiryDate: string;
    purchaseCost: number;
    sellingPrice: number;
    notes?: string;
  }) {
    // Check if batch number exists for product
    const existing = await db.query(
      'SELECT id FROM product_batches WHERE product_id = $1 AND batch_number = $2',
      [data.productId, data.batchNumber]
    );
    if (existing.rows.length > 0) {
      throw new ConflictError(`Batch number '${data.batchNumber}' already exists for this medicine`);
    }

    const res = await db.query(
      `INSERT INTO product_batches (organization_id, product_id, supplier_id, batch_number, manufacturing_date, expiry_date, purchase_cost, selling_price, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        organizationId,
        data.productId,
        data.supplierId || null,
        data.batchNumber,
        data.manufacturingDate || null,
        data.expiryDate,
        data.purchaseCost,
        data.sellingPrice,
        data.notes || null,
      ]
    );

    return res.rows[0];
  }

  async updateQuarantine(organizationId: string, batchId: string, isQuarantined: boolean, notes?: string) {
    const res = await db.query(
      `UPDATE product_batches
       SET is_quarantined = $1,
           notes = COALESCE($2, notes),
           updated_at = CURRENT_TIMESTAMP
       WHERE organization_id = $3 AND id = $4
       RETURNING *`,
      [isQuarantined, notes, organizationId, batchId]
    );
    if (res.rows.length === 0) throw new NotFoundError('Batch not found');
    return res.rows[0];
  }
}

export const batchesService = new BatchesService();
