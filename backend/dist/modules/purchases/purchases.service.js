"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.purchasesService = exports.PurchasesService = void 0;
const connection_1 = require("../../database/connection");
const errors_1 = require("../../common/errors");
const notifications_service_1 = require("../notifications/notifications.service");
class PurchasesService {
    async listPurchases(organizationId, branchId, status) {
        let query = `
      SELECT p.*, s.name AS supplier_name, l.name AS destination_location_name,
             u.first_name || ' ' || u.last_name AS created_by_name,
             COUNT(pi.id) AS total_items
      FROM purchases p
      JOIN suppliers s ON p.supplier_id = s.id
      JOIN locations l ON p.destination_location_id = l.id
      JOIN users u ON p.created_by = u.id
      LEFT JOIN purchase_items pi ON p.id = pi.purchase_id
      WHERE p.organization_id = $1
    `;
        const params = [organizationId];
        if (branchId) {
            params.push(branchId);
            query += ` AND p.branch_id = $${params.length}`;
        }
        if (status) {
            params.push(status);
            query += ` AND p.status = $${params.length}`;
        }
        query += `
      GROUP BY p.id, s.name, l.name, u.first_name, u.last_name
      ORDER BY p.purchase_date DESC, p.created_at DESC
    `;
        const res = await connection_1.db.query(query, params);
        return res.rows;
    }
    async getPurchaseById(organizationId, purchaseId) {
        const res = await connection_1.db.query(`SELECT p.*, s.name AS supplier_name, l.name AS destination_location_name,
              u.first_name || ' ' || u.last_name AS created_by_name,
              au.first_name || ' ' || au.last_name AS approved_by_name,
              ou.first_name || ' ' || ou.last_name AS ordered_by_name,
              ru.first_name || ' ' || ru.last_name AS received_by_name,
              cu.first_name || ' ' || cu.last_name AS cancelled_by_name
       FROM purchases p
       JOIN suppliers s ON p.supplier_id = s.id
       JOIN locations l ON p.destination_location_id = l.id
       JOIN users u ON p.created_by = u.id
       LEFT JOIN users au ON p.approved_by = au.id
       LEFT JOIN users ou ON p.ordered_by = ou.id
       LEFT JOIN users ru ON p.received_by = ru.id
       LEFT JOIN users cu ON p.cancelled_by = cu.id
       WHERE p.organization_id = $1 AND p.id = $2`, [organizationId, purchaseId]);
        if (res.rows.length === 0)
            throw new errors_1.NotFoundError('Purchase order not found');
        const purchase = res.rows[0];
        const itemsRes = await connection_1.db.query(`SELECT pi.*, pr.generic_name, pr.brand_name, pr.strength, pr.dosage_form
       FROM purchase_items pi
       JOIN products pr ON pi.product_id = pr.id
       WHERE pi.purchase_id = $1`, [purchaseId]);
        return {
            ...purchase,
            items: itemsRes.rows,
        };
    }
    async createPurchase(organizationId, userId, data) {
        return await connection_1.db.withTransaction(async (client) => {
            // Calculate total
            let totalAmount = 0;
            for (const item of data.items) {
                totalAmount += item.quantityOrdered * item.unitCost;
            }
            const initialStatus = data.status || 'DRAFT';
            const pRes = await client.query(`INSERT INTO purchases (
          organization_id, branch_id, supplier_id, destination_location_id,
          invoice_number, purchase_date, status, total_amount, subtotal, notes, created_by
        ) VALUES ($1, $2, $3, $4, $5, COALESCE($6, CURRENT_DATE), $7, $8, $8, $9, $10)
        RETURNING *`, [
                organizationId,
                data.branchId,
                data.supplierId,
                data.destinationLocationId,
                data.invoiceNumber || `PO-${Date.now().toString().slice(-6)}`,
                data.purchaseDate || null,
                initialStatus,
                totalAmount,
                data.notes || null,
                userId,
            ]);
            const purchase = pRes.rows[0];
            for (const item of data.items) {
                const itemTotal = item.quantityOrdered * item.unitCost;
                await client.query(`INSERT INTO purchase_items (
            purchase_id, product_id, batch_number, manufacturing_date, expiry_date,
            quantity_ordered, unit_cost, unit_selling_price, total_cost
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`, [
                    purchase.id,
                    item.productId,
                    item.batchNumber,
                    item.manufacturingDate || null,
                    item.expiryDate,
                    item.quantityOrdered,
                    item.unitCost,
                    item.unitSellingPrice,
                    itemTotal,
                ]);
            }
            return purchase;
        });
    }
    async submitPurchase(organizationId, purchaseId) {
        return await connection_1.db.withTransaction(async (client) => {
            const pRes = await client.query(`UPDATE purchases
         SET status = 'SUBMITTED', updated_at = CURRENT_TIMESTAMP
         WHERE organization_id = $1 AND id = $2 AND status = 'DRAFT'
         RETURNING *`, [organizationId, purchaseId]);
            if (pRes.rows.length === 0) {
                throw new errors_1.BadRequestError('Purchase order not found or not in DRAFT status');
            }
            return pRes.rows[0];
        });
    }
    async approvePurchase(organizationId, purchaseId, userId) {
        return await connection_1.db.withTransaction(async (client) => {
            const pRes = await client.query(`UPDATE purchases
         SET status = 'APPROVED', approved_by = $1, approved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE organization_id = $2 AND id = $3 AND status = 'SUBMITTED'
         RETURNING *`, [userId, organizationId, purchaseId]);
            if (pRes.rows.length === 0) {
                throw new errors_1.BadRequestError('Purchase order not found or not in SUBMITTED status');
            }
            return pRes.rows[0];
        });
    }
    async orderPurchase(organizationId, purchaseId, userId) {
        return await connection_1.db.withTransaction(async (client) => {
            const pRes = await client.query(`UPDATE purchases
         SET status = 'ORDERED', ordered_by = $1, ordered_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE organization_id = $2 AND id = $3 AND status IN ('APPROVED', 'SUBMITTED', 'DRAFT')
         RETURNING *`, [userId, organizationId, purchaseId]);
            if (pRes.rows.length === 0) {
                throw new errors_1.BadRequestError('Purchase order not found or invalid status for ordering');
            }
            return pRes.rows[0];
        });
    }
    async cancelPurchase(organizationId, purchaseId, userId, reason) {
        return await connection_1.db.withTransaction(async (client) => {
            const pRes = await client.query(`UPDATE purchases
         SET status = 'CANCELLED', cancelled_by = $1, cancelled_at = CURRENT_TIMESTAMP,
             cancellation_reason = $2, updated_at = CURRENT_TIMESTAMP
         WHERE organization_id = $3 AND id = $4 AND status NOT IN ('RECEIVED', 'CANCELLED')
         RETURNING *`, [userId, reason, organizationId, purchaseId]);
            if (pRes.rows.length === 0) {
                throw new errors_1.BadRequestError('Cannot cancel purchase order that is already received or cancelled');
            }
            return pRes.rows[0];
        });
    }
    async receiveGoods(organizationId, purchaseId, userId, customReceivedItems) {
        return await connection_1.db.withTransaction(async (client) => {
            const pRes = await client.query(`SELECT * FROM purchases WHERE organization_id = $1 AND id = $2 FOR UPDATE`, [organizationId, purchaseId]);
            if (pRes.rows.length === 0)
                throw new errors_1.NotFoundError('Purchase order not found');
            const purchase = pRes.rows[0];
            if (purchase.status === 'RECEIVED' || purchase.status === 'CANCELLED') {
                throw new errors_1.BadRequestError(`Cannot receive goods for purchase in '${purchase.status}' status`);
            }
            const itemsRes = await client.query(`SELECT * FROM purchase_items WHERE purchase_id = $1`, [purchaseId]);
            const items = itemsRes.rows;
            const productIdsToNotify = new Set();
            let totalOrdered = 0;
            let totalReceived = 0;
            for (const item of items) {
                let qtyToReceiveNow = parseFloat(item.quantity_ordered) - parseFloat(item.quantity_received);
                if (customReceivedItems && customReceivedItems.length > 0) {
                    const match = customReceivedItems.find((r) => r.itemId === item.id);
                    if (match)
                        qtyToReceiveNow = match.quantityReceived;
                }
                if (qtyToReceiveNow <= 0) {
                    totalOrdered += parseFloat(item.quantity_ordered);
                    totalReceived += parseFloat(item.quantity_received);
                    continue;
                }
                // 1. Create or Find/Update Batch in product_batches
                const batchRes = await client.query(`INSERT INTO product_batches (
            organization_id, product_id, supplier_id, batch_number,
            manufacturing_date, expiry_date, purchase_cost, selling_price, initial_quantity
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (product_id, batch_number)
          DO UPDATE SET
            expiry_date = EXCLUDED.expiry_date,
            purchase_cost = EXCLUDED.purchase_cost,
            selling_price = EXCLUDED.selling_price
          RETURNING id`, [
                    organizationId,
                    item.product_id,
                    purchase.supplier_id,
                    item.batch_number,
                    item.manufacturing_date || null,
                    item.expiry_date,
                    item.unit_cost,
                    item.unit_selling_price,
                    qtyToReceiveNow,
                ]);
                const batchId = batchRes.rows[0].id;
                const newCumReceived = parseFloat(item.quantity_received) + qtyToReceiveNow;
                // 2. Update purchase item with cumulative received quantity & batch_id
                await client.query(`UPDATE purchase_items
           SET quantity_received = $1, batch_id = $2
           WHERE id = $3`, [newCumReceived, batchId, item.id]);
                // 3. Add inventory to destination Warehouse location
                await client.query(`INSERT INTO inventory (organization_id, branch_id, location_id, product_id, batch_id, quantity)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (location_id, batch_id)
           DO UPDATE SET quantity = inventory.quantity + EXCLUDED.quantity, updated_at = CURRENT_TIMESTAMP`, [
                    organizationId,
                    purchase.branch_id,
                    purchase.destination_location_id,
                    item.product_id,
                    batchId,
                    qtyToReceiveNow,
                ]);
                // 4. Record RECEIVE inventory transaction
                await client.query(`INSERT INTO inventory_transactions (
            organization_id, branch_id, product_id, batch_id,
            destination_location_id, transaction_type, quantity, unit_cost,
            reference_id, reference_type, notes, performed_by
          ) VALUES ($1, $2, $3, $4, $5, 'RECEIVE', $6, $7, $8, 'PURCHASE_RECEIPT', $9, $10)`, [
                    organizationId,
                    purchase.branch_id,
                    item.product_id,
                    batchId,
                    purchase.destination_location_id,
                    qtyToReceiveNow,
                    item.unit_cost,
                    purchase.id,
                    `Received PO #${purchase.invoice_number} batch ${item.batch_number}`,
                    userId,
                ]);
                totalOrdered += parseFloat(item.quantity_ordered);
                totalReceived += newCumReceived;
                productIdsToNotify.add(item.product_id);
            }
            // 5. Determine new lifecycle status: RECEIVED vs PARTIALLY_RECEIVED
            const newStatus = totalReceived >= totalOrdered ? 'RECEIVED' : 'PARTIALLY_RECEIVED';
            const updatedPurchase = await client.query(`UPDATE purchases
         SET status = $1, received_by = $2, received_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE id = $3
         RETURNING *`, [newStatus, userId, purchaseId]);
            // 6. Notify evaluated stock state
            for (const pId of productIdsToNotify) {
                setTimeout(() => {
                    notifications_service_1.notificationsService.evaluateProductStockAlerts(organizationId, purchase.branch_id, pId).catch(console.error);
                }, 0);
            }
            return updatedPurchase.rows[0];
        });
    }
}
exports.PurchasesService = PurchasesService;
exports.purchasesService = new PurchasesService();
//# sourceMappingURL=purchases.service.js.map