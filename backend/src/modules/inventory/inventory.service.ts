import { db } from '../../database/connection';
import { BadRequestError, NotFoundError } from '../../common/errors';
import { notificationsService } from '../notifications/notifications.service';

export interface LocationStockSummary {
  productId: string;
  genericName: string;
  brandName: string | null;
  strength: string;
  dosageForm: string;
  shelfMinQuantity: number;
  warehouseMinQuantity: number;
  shelfStock: number;
  warehouseStock: number;
  otherStock: number;
  totalStock: number;
  status: 'AVAILABLE' | 'SHELF_LOW' | 'SHELF_EMPTY' | 'WAREHOUSE_LOW' | 'COMPLETELY_OUT_OF_STOCK';
  systemAction: string;
}

export class InventoryService {
  async getStockOverview(organizationId: string, branchId?: string): Promise<LocationStockSummary[]> {
    let query = `
      SELECT p.id AS product_id, p.generic_name, p.brand_name, p.strength, p.dosage_form,
             p.shelf_min_quantity, p.warehouse_min_quantity,
             COALESCE(SUM(CASE WHEN l.location_type = 'SALES_SHELF' THEN i.quantity ELSE 0 END), 0) AS shelf_stock,
             COALESCE(SUM(CASE WHEN l.location_type = 'WAREHOUSE' THEN i.quantity ELSE 0 END), 0) AS warehouse_stock,
             COALESCE(SUM(CASE WHEN l.location_type NOT IN ('SALES_SHELF', 'WAREHOUSE') THEN i.quantity ELSE 0 END), 0) AS other_stock,
             COALESCE(SUM(i.quantity), 0) AS total_stock
      FROM products p
      LEFT JOIN inventory i ON p.id = i.product_id
      LEFT JOIN locations l ON i.location_id = l.id
      WHERE p.organization_id = $1
    `;
    const params: any[] = [organizationId];

    if (branchId) {
      params.push(branchId);
      query += ` AND (i.branch_id = $${params.length} OR i.branch_id IS NULL)`;
    }

    query += `
      GROUP BY p.id, p.generic_name, p.brand_name, p.strength, p.dosage_form, p.shelf_min_quantity, p.warehouse_min_quantity
      ORDER BY p.generic_name ASC
    `;

    const res = await db.query(query, params);

    return res.rows.map((row) => {
      const shelfStock = parseFloat(row.shelf_stock);
      const warehouseStock = parseFloat(row.warehouse_stock);
      const otherStock = parseFloat(row.other_stock);
      const totalStock = parseFloat(row.total_stock);
      const shelfMin = parseFloat(row.shelf_min_quantity);
      const whMin = parseFloat(row.warehouse_min_quantity);

      let status: LocationStockSummary['status'] = 'AVAILABLE';
      let systemAction = 'Normal operation';

      if (shelfStock === 0 && warehouseStock === 0 && totalStock === 0) {
        status = 'COMPLETELY_OUT_OF_STOCK';
        systemAction = 'Send critical stock-out notification and recommend purchasing';
      } else if (shelfStock === 0 && warehouseStock > 0) {
        status = 'SHELF_EMPTY';
        systemAction = 'Recommend transfer from warehouse; do NOT request a purchase';
      } else if (shelfStock <= shelfMin && warehouseStock > 0) {
        status = 'SHELF_LOW';
        systemAction = 'Notify according to shelf threshold; prepare warehouse refill';
      } else if (warehouseStock <= whMin) {
        status = 'WAREHOUSE_LOW';
        systemAction = 'Recommend warehouse replenishment/purchase based on demand';
      }

      return {
        productId: row.product_id,
        genericName: row.generic_name,
        brandName: row.brand_name,
        strength: row.strength,
        dosageForm: row.dosage_form,
        shelfMinQuantity: shelfMin,
        warehouseMinQuantity: whMin,
        shelfStock,
        warehouseStock,
        otherStock,
        totalStock,
        status,
        systemAction,
      };
    });
  }

  async getInventoryByLocation(organizationId: string, locationId: string) {
    const res = await db.query(
      `SELECT i.id, i.quantity, i.updated_at,
              p.id AS product_id, p.generic_name, p.brand_name, p.strength, p.dosage_form, p.sku, p.barcode,
              pb.id AS batch_id, pb.batch_number, pb.manufacturing_date, pb.expiry_date,
              pb.purchase_cost, pb.selling_price, pb.is_quarantined
       FROM inventory i
       JOIN products p ON i.product_id = p.id
       JOIN product_batches pb ON i.batch_id = pb.id
       WHERE i.organization_id = $1 AND i.location_id = $2 AND i.quantity > 0
       ORDER BY p.generic_name ASC, pb.expiry_date ASC`,
      [organizationId, locationId]
    );
    return res.rows;
  }

  async transferStock(
    organizationId: string,
    performedByUserId: string,
    data: {
      productId: string;
      batchId: string;
      sourceLocationId: string;
      destinationLocationId: string;
      quantity: number;
      notes?: string;
    }
  ) {
    if (data.sourceLocationId === data.destinationLocationId) {
      throw new BadRequestError('Source and destination locations cannot be the same');
    }

    return await db.withTransaction(async (client) => {
      // 1. Verify batch and product
      const batchRes = await client.query(
        `SELECT pb.*, p.generic_name
         FROM product_batches pb
         JOIN products p ON pb.product_id = p.id
         WHERE pb.id = $1 AND pb.organization_id = $2`,
        [data.batchId, organizationId]
      );

      if (batchRes.rows.length === 0) {
        throw new NotFoundError('Batch not found');
      }

      const batch = batchRes.rows[0];

      // Block expired batch transfers to sales shelf
      const isExpired = new Date(batch.expiry_date) < new Date();
      if (isExpired) {
        throw new BadRequestError(`Cannot transfer expired batch '${batch.batch_number}' (Expired on ${batch.expiry_date}) to active stock`);
      }

      // 2. Lock and verify source inventory
      const srcInvRes = await client.query(
        `SELECT id, branch_id, quantity
         FROM inventory
         WHERE organization_id = $1 AND location_id = $2 AND batch_id = $3
         FOR UPDATE`,
        [organizationId, data.sourceLocationId, data.batchId]
      );

      if (srcInvRes.rows.length === 0 || parseFloat(srcInvRes.rows[0].quantity) < data.quantity) {
        const available = srcInvRes.rows.length > 0 ? parseFloat(srcInvRes.rows[0].quantity) : 0;
        throw new BadRequestError(`Insufficient stock in source location. Available: ${available}, Requested: ${data.quantity}`);
      }

      const srcInv = srcInvRes.rows[0];

      // 3. Get destination location details
      const dstLocRes = await client.query(
        'SELECT id, branch_id, name, location_type FROM locations WHERE organization_id = $1 AND id = $2',
        [organizationId, data.destinationLocationId]
      );
      if (dstLocRes.rows.length === 0) {
        throw new NotFoundError('Destination location not found');
      }
      const dstLoc = dstLocRes.rows[0];

      // 4. Deduct from source inventory
      await client.query(
        `UPDATE inventory
         SET quantity = quantity - $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [data.quantity, srcInv.id]
      );

      // 5. Add to destination inventory (Upsert)
      await client.query(
        `INSERT INTO inventory (organization_id, branch_id, location_id, product_id, batch_id, quantity)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (location_id, batch_id)
         DO UPDATE SET quantity = inventory.quantity + EXCLUDED.quantity, updated_at = CURRENT_TIMESTAMP`,
        [organizationId, dstLoc.branch_id, data.destinationLocationId, data.productId, data.batchId, data.quantity]
      );

      // 6. Record TRANSFER inventory transaction
      const txRes = await client.query(
        `INSERT INTO inventory_transactions (
          organization_id, branch_id, product_id, batch_id,
          source_location_id, destination_location_id,
          transaction_type, quantity, unit_cost, reference_type, notes, performed_by
        ) VALUES ($1, $2, $3, $4, $5, $6, 'TRANSFER', $7, $8, 'MANUAL_TRANSFER', $9, $10)
        RETURNING *`,
        [
          organizationId,
          srcInv.branch_id,
          data.productId,
          data.batchId,
          data.sourceLocationId,
          data.destinationLocationId,
          data.quantity,
          batch.purchase_cost,
          data.notes || null,
          performedByUserId,
        ]
      );

      // 7. Check post-movement alerts asynchronously
      setTimeout(() => {
        notificationsService.evaluateProductStockAlerts(organizationId, srcInv.branch_id, data.productId).catch(console.error);
      }, 0);

      return {
        message: 'Stock transferred successfully',
        transaction: txRes.rows[0],
        transferredQuantity: data.quantity,
      };
    });
  }

  async adjustStock(
    organizationId: string,
    performedByUserId: string,
    data: {
      locationId: string;
      productId: string;
      batchId: string;
      countedQuantity: number;
      reason: string;
    }
  ) {
    return await db.withTransaction(async (client) => {
      // Lock current inventory row
      const invRes = await client.query(
        `SELECT i.id, i.branch_id, i.quantity, pb.purchase_cost
         FROM inventory i
         JOIN product_batches pb ON i.batch_id = pb.id
         WHERE i.organization_id = $1 AND i.location_id = $2 AND i.batch_id = $3
         FOR UPDATE`,
        [organizationId, data.locationId, data.batchId]
      );

      let currentQty = 0;
      let branchId: string;
      let unitCost = 0;

      if (invRes.rows.length === 0) {
        // Find branch from location
        const locRes = await client.query('SELECT branch_id FROM locations WHERE id = $1', [data.locationId]);
        if (locRes.rows.length === 0) throw new NotFoundError('Location not found');
        branchId = locRes.rows[0].branch_id;

        const batchRes = await client.query('SELECT purchase_cost FROM product_batches WHERE id = $1', [data.batchId]);
        if (batchRes.rows.length === 0) throw new NotFoundError('Batch not found');
        unitCost = parseFloat(batchRes.rows[0].purchase_cost);

        await client.query(
          `INSERT INTO inventory (organization_id, branch_id, location_id, product_id, batch_id, quantity)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [organizationId, branchId, data.locationId, data.productId, data.batchId, data.countedQuantity]
        );
      } else {
        currentQty = parseFloat(invRes.rows[0].quantity);
        branchId = invRes.rows[0].branch_id;
        unitCost = parseFloat(invRes.rows[0].purchase_cost);

        await client.query(
          `UPDATE inventory
           SET quantity = $1, updated_at = CURRENT_TIMESTAMP
           WHERE id = $2`,
          [data.countedQuantity, invRes.rows[0].id]
        );
      }

      const delta = data.countedQuantity - currentQty;

      // Record STOCK_COUNT_ADJUSTMENT transaction
      const txRes = await client.query(
        `INSERT INTO inventory_transactions (
          organization_id, branch_id, product_id, batch_id,
          destination_location_id, transaction_type, quantity, unit_cost, reference_type, notes, performed_by
        ) VALUES ($1, $2, $3, $4, $5, 'STOCK_COUNT_ADJUSTMENT', $6, $7, 'AUDIT_CORRECTION', $8, $9)
        RETURNING *`,
        [
          organizationId,
          branchId,
          data.productId,
          data.batchId,
          data.locationId,
          delta,
          unitCost,
          `Stock count adjusted from ${currentQty} to ${data.countedQuantity}. Reason: ${data.reason}`,
          performedByUserId,
        ]
      );

      // Evaluate stock alerts
      setTimeout(() => {
        notificationsService.evaluateProductStockAlerts(organizationId, branchId, data.productId).catch(console.error);
      }, 0);

      return {
        message: 'Stock adjusted successfully',
        previousQuantity: currentQty,
        countedQuantity: data.countedQuantity,
        delta,
        transaction: txRes.rows[0],
      };
    });
  }

  async recordLoss(
    organizationId: string,
    performedByUserId: string,
    data: {
      locationId: string;
      productId: string;
      batchId: string;
      quantity: number;
      lossType: 'DAMAGE' | 'EXPIRED';
      notes: string;
    }
  ) {
    return await db.withTransaction(async (client) => {
      const invRes = await client.query(
        `SELECT i.id, i.branch_id, i.quantity, pb.purchase_cost
         FROM inventory i
         JOIN product_batches pb ON i.batch_id = pb.id
         WHERE i.organization_id = $1 AND i.location_id = $2 AND i.batch_id = $3
         FOR UPDATE`,
        [organizationId, data.locationId, data.batchId]
      );

      if (invRes.rows.length === 0 || parseFloat(invRes.rows[0].quantity) < data.quantity) {
        const available = invRes.rows.length > 0 ? parseFloat(invRes.rows[0].quantity) : 0;
        throw new BadRequestError(`Insufficient stock to write off. Available: ${available}, Requested: ${data.quantity}`);
      }

      const inv = invRes.rows[0];

      // Deduct from location inventory
      await client.query(
        `UPDATE inventory
         SET quantity = quantity - $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [data.quantity, inv.id]
      );

      // Record transaction
      const txRes = await client.query(
        `INSERT INTO inventory_transactions (
          organization_id, branch_id, product_id, batch_id,
          source_location_id, transaction_type, quantity, unit_cost, reference_type, notes, performed_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'LOSS_WRITEOFF', $9, $10)
        RETURNING *`,
        [
          organizationId,
          inv.branch_id,
          data.productId,
          data.batchId,
          data.locationId,
          data.lossType,
          data.quantity,
          inv.purchase_cost,
          data.notes,
          performedByUserId,
        ]
      );

      // Evaluate stock alerts
      setTimeout(() => {
        notificationsService.evaluateProductStockAlerts(organizationId, inv.branch_id, data.productId).catch(console.error);
      }, 0);

      return {
        message: `${data.lossType} stock write-off recorded successfully`,
        lossQuantity: data.quantity,
        totalCostLost: data.quantity * parseFloat(inv.purchase_cost),
        transaction: txRes.rows[0],
      };
    });
  }

  async getTransactionHistory(
    organizationId: string,
    filters: {
      branchId?: string;
      productId?: string;
      batchId?: string;
      transactionType?: string;
      startDate?: string;
      endDate?: string;
      limit?: number;
      offset?: number;
    }
  ) {
    let query = `
      SELECT it.*,
             p.generic_name, p.brand_name, p.strength, p.dosage_form,
             pb.batch_number, pb.expiry_date,
             src.name AS source_location_name, src.location_type AS source_location_type,
             dst.name AS destination_location_name, dst.location_type AS destination_location_type,
             u.first_name || ' ' || u.last_name AS performed_by_name
      FROM inventory_transactions it
      JOIN products p ON it.product_id = p.id
      JOIN product_batches pb ON it.batch_id = pb.id
      LEFT JOIN locations src ON it.source_location_id = src.id
      LEFT JOIN locations dst ON it.destination_location_id = dst.id
      JOIN users u ON it.performed_by = u.id
      WHERE it.organization_id = $1
    `;
    const params: any[] = [organizationId];

    if (filters.branchId) {
      params.push(filters.branchId);
      query += ` AND it.branch_id = $${params.length}`;
    }

    if (filters.productId) {
      params.push(filters.productId);
      query += ` AND it.product_id = $${params.length}`;
    }

    if (filters.batchId) {
      params.push(filters.batchId);
      query += ` AND it.batch_id = $${params.length}`;
    }

    if (filters.transactionType) {
      params.push(filters.transactionType);
      query += ` AND it.transaction_type = $${params.length}`;
    }

    if (filters.startDate) {
      params.push(filters.startDate);
      query += ` AND it.created_at >= $${params.length}`;
    }

    if (filters.endDate) {
      params.push(filters.endDate);
      query += ` AND it.created_at <= $${params.length}`;
    }

    query += ` ORDER BY it.created_at DESC`;

    if (filters.limit) {
      params.push(filters.limit);
      query += ` LIMIT $${params.length}`;
    }

    if (filters.offset) {
      params.push(filters.offset);
      query += ` OFFSET $${params.length}`;
    }

    const res = await db.query(query, params);
    return res.rows;
  }
}

export const inventoryService = new InventoryService();
