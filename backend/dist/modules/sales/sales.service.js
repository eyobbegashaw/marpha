"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.salesService = exports.SalesService = void 0;
const connection_1 = require("../../database/connection");
const errors_1 = require("../../common/errors");
const notifications_service_1 = require("../notifications/notifications.service");
class SalesService {
    async listSales(organizationId, filters) {
        let query = `
      SELECT s.*,
             u.first_name || ' ' || u.last_name AS cashier_name,
             CASE WHEN b_user.id IS NOT NULL THEN b_user.first_name || ' ' || b_user.last_name ELSE NULL END AS buyer_name,
             b_user.phone AS buyer_phone,
             b_user.email AS buyer_email,
             b.name AS branch_name,
             l.name AS location_name,
             COUNT(si.id) AS item_count
      FROM sales s
      JOIN users u ON s.cashier_id = u.id
      JOIN branches b ON s.branch_id = b.id
      JOIN locations l ON s.location_id = l.id
      LEFT JOIN users b_user ON s.buyer_id = b_user.id
      LEFT JOIN sale_items si ON s.id = si.sale_id
      WHERE s.organization_id = $1
    `;
        const params = [organizationId];
        if (filters.branchId) {
            params.push(filters.branchId);
            query += ` AND s.branch_id = $${params.length}`;
        }
        if (filters.cashierId) {
            params.push(filters.cashierId);
            query += ` AND s.cashier_id = $${params.length}`;
        }
        if (filters.buyerId) {
            params.push(filters.buyerId);
            query += ` AND s.buyer_id = $${params.length}`;
        }
        if (filters.startDate) {
            params.push(filters.startDate);
            query += ` AND s.sale_date >= $${params.length}`;
        }
        if (filters.endDate) {
            params.push(filters.endDate);
            query += ` AND s.sale_date <= $${params.length}`;
        }
        query += `
      GROUP BY s.id, u.first_name, u.last_name, b_user.id, b_user.first_name, b_user.last_name, b_user.phone, b_user.email, b.name, l.name
      ORDER BY s.sale_date DESC, s.created_at DESC
    `;
        if (filters.limit) {
            params.push(filters.limit);
            query += ` LIMIT $${params.length}`;
        }
        if (filters.offset) {
            params.push(filters.offset);
            query += ` OFFSET $${params.length}`;
        }
        const res = await connection_1.db.query(query, params);
        return res.rows;
    }
    async getSaleById(organizationId, saleId) {
        const res = await connection_1.db.query(`SELECT s.*,
              u.first_name || ' ' || u.last_name AS cashier_name,
              CASE WHEN b_user.id IS NOT NULL THEN b_user.first_name || ' ' || b_user.last_name ELSE NULL END AS buyer_name,
              b_user.phone AS buyer_phone,
              b_user.email AS buyer_email,
              b.name AS branch_name,
              l.name AS location_name
       FROM sales s
       JOIN users u ON s.cashier_id = u.id
       JOIN branches b ON s.branch_id = b.id
       JOIN locations l ON s.location_id = l.id
       LEFT JOIN users b_user ON s.buyer_id = b_user.id
       WHERE s.organization_id = $1 AND s.id = $2`, [organizationId, saleId]);
        if (res.rows.length === 0)
            throw new errors_1.NotFoundError('Sale invoice not found');
        const sale = res.rows[0];
        const itemsRes = await connection_1.db.query(`SELECT si.*,
              p.generic_name, p.brand_name, p.strength, p.dosage_form,
              pb.batch_number, pb.expiry_date
       FROM sale_items si
       JOIN products p ON si.product_id = p.id
       JOIN product_batches pb ON si.batch_id = pb.id
       WHERE si.sale_id = $1`, [saleId]);
        return {
            ...sale,
            items: itemsRes.rows,
        };
    }
    async getMyPurchases(buyerId) {
        const res = await connection_1.db.query(`SELECT s.id, s.invoice_number, s.sale_date, s.subtotal, s.discount_amount, s.tax_amount, s.total_amount,
              b.name AS branch_name,
              COUNT(si.id) AS item_count
       FROM sales s
       JOIN branches b ON s.branch_id = b.id
       LEFT JOIN sale_items si ON s.id = si.sale_id
       WHERE s.buyer_id = $1
       GROUP BY s.id, s.invoice_number, s.sale_date, s.subtotal, s.discount_amount, s.tax_amount, s.total_amount, b.name
       ORDER BY s.sale_date DESC, s.created_at DESC`, [buyerId]);
        return res.rows;
    }
    async getMyPurchaseById(buyerId, saleId) {
        const res = await connection_1.db.query(`SELECT s.id, s.invoice_number, s.sale_date, s.subtotal, s.discount_amount, s.tax_amount, s.total_amount, s.notes,
              b.name AS branch_name
       FROM sales s
       JOIN branches b ON s.branch_id = b.id
       WHERE s.buyer_id = $1 AND s.id = $2`, [buyerId, saleId]);
        if (res.rows.length === 0)
            throw new errors_1.NotFoundError('Purchase record not found');
        const sale = res.rows[0];
        const itemsRes = await connection_1.db.query(`SELECT si.id, si.quantity, si.unit_price, si.subtotal, si.discount, si.total,
              p.generic_name, p.brand_name, p.strength, p.dosage_form,
              pb.batch_number, pb.expiry_date
       FROM sale_items si
       JOIN products p ON si.product_id = p.id
       JOIN product_batches pb ON si.batch_id = pb.id
       WHERE si.sale_id = $1`, [saleId]);
        return {
            ...sale,
            items: itemsRes.rows,
        };
    }
    async createSale(organizationId, cashierId, data) {
        // Check offline idempotency
        if (data.offlineSyncId) {
            const existing = await connection_1.db.query('SELECT * FROM sales WHERE organization_id = $1 AND offline_sync_id = $2', [organizationId, data.offlineSyncId]);
            if (existing.rows.length > 0) {
                return {
                    sale: existing.rows[0],
                    isIdempotentReplay: true,
                    message: 'Sale already synchronized previously (idempotent response)',
                };
            }
        }
        return await connection_1.db.withTransaction(async (client) => {
            // 1. Generate Invoice Number
            const invoiceNumber = `INV-${Date.now().toString().slice(-8)}`;
            // 2. Prepare items with FEFO batch allocation and inventory deductions
            const processedItems = [];
            let totalSubtotal = 0;
            let totalCogs = 0;
            const productIdsToEvaluate = new Set();
            for (const reqItem of data.items) {
                let remainingToFulfill = reqItem.quantity;
                // Fetch available inventory with batches in FEFO order (expiry_date ASC)
                let batchQuery = `
          SELECT i.id AS inventory_id, i.quantity, i.batch_id,
                 pb.batch_number, pb.expiry_date, pb.purchase_cost, pb.selling_price, pb.is_quarantined,
                 p.default_selling_price, p.generic_name
          FROM inventory i
          JOIN product_batches pb ON i.batch_id = pb.id
          JOIN products p ON i.product_id = p.id
          WHERE i.organization_id = $1 AND i.location_id = $2 AND i.product_id = $3
            AND i.quantity > 0 AND pb.is_quarantined = FALSE
        `;
                const params = [organizationId, data.locationId, reqItem.productId];
                if (reqItem.batchId) {
                    params.push(reqItem.batchId);
                    batchQuery += ` AND i.batch_id = $${params.length}`;
                }
                // FEFO order: earliest expiry first
                batchQuery += ` ORDER BY pb.expiry_date ASC FOR UPDATE`;
                const availableBatchesRes = await client.query(batchQuery, params);
                const availableBatches = availableBatchesRes.rows;
                if (availableBatches.length === 0) {
                    throw new errors_1.BadRequestError(`No available sellable stock for medicine in the selected shelf location`);
                }
                let fulfilled = 0;
                for (const batchRow of availableBatches) {
                    if (remainingToFulfill <= 0)
                        break;
                    // Check expiry: BLOCK expired medicines from sale!
                    const isExpired = new Date(batchRow.expiry_date) < new Date();
                    if (isExpired) {
                        continue; // Skip expired batches from sales fulfillment
                    }
                    const currentQty = parseFloat(batchRow.quantity);
                    const qtyToTake = Math.min(remainingToFulfill, currentQty);
                    const unitCost = parseFloat(batchRow.purchase_cost);
                    const unitPrice = reqItem.unitPrice !== undefined ? reqItem.unitPrice : parseFloat(batchRow.selling_price || batchRow.default_selling_price);
                    const itemDiscount = reqItem.discount ? (reqItem.discount * (qtyToTake / reqItem.quantity)) : 0;
                    const itemSubtotal = qtyToTake * unitPrice;
                    const itemTotal = itemSubtotal - itemDiscount;
                    const itemCogs = qtyToTake * unitCost;
                    const itemGrossProfit = itemTotal - itemCogs;
                    // Deduct inventory atomically
                    await client.query(`UPDATE inventory
             SET quantity = quantity - $1, updated_at = CURRENT_TIMESTAMP
             WHERE id = $2`, [qtyToTake, batchRow.inventory_id]);
                    processedItems.push({
                        productId: reqItem.productId,
                        batchId: batchRow.batch_id,
                        locationId: data.locationId,
                        quantity: qtyToTake,
                        unitCost,
                        unitPrice,
                        subtotal: itemSubtotal,
                        discount: itemDiscount,
                        total: itemTotal,
                        cogs: itemCogs,
                        grossProfit: itemGrossProfit,
                    });
                    totalSubtotal += itemSubtotal;
                    totalCogs += itemCogs;
                    remainingToFulfill -= qtyToTake;
                    fulfilled += qtyToTake;
                }
                if (remainingToFulfill > 0) {
                    throw new errors_1.BadRequestError(`Insufficient valid (unexpired) shelf stock to complete sale for item. Requested: ${reqItem.quantity}, Available on shelf: ${fulfilled}`);
                }
                productIdsToEvaluate.add(reqItem.productId);
            }
            // Calculate totals
            const discountAmount = data.discountAmount || 0;
            const taxAmount = data.taxAmount || 0;
            const totalAmount = totalSubtotal - discountAmount + taxAmount;
            const grossProfit = totalAmount - totalCogs;
            // 3. Insert Sale Header
            const saleRes = await client.query(`INSERT INTO sales (
          organization_id, branch_id, location_id, buyer_id, cashier_id,
          invoice_number, subtotal, discount_amount, tax_amount, total_amount, total_cogs, gross_profit,
          offline_sync_id, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *`, [
                organizationId,
                data.branchId,
                data.locationId,
                data.buyerId || null,
                cashierId,
                invoiceNumber,
                totalSubtotal,
                discountAmount,
                taxAmount,
                totalAmount,
                totalCogs,
                grossProfit,
                data.offlineSyncId || null,
                data.notes || null,
            ]);
            const sale = saleRes.rows[0];
            // 4. Insert Sale Items & Inventory Transactions
            for (const item of processedItems) {
                await client.query(`INSERT INTO sale_items (
            sale_id, product_id, batch_id, location_id, quantity,
            unit_cost, unit_price, subtotal, discount, total, cogs, gross_profit
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`, [
                    sale.id,
                    item.productId,
                    item.batchId,
                    item.locationId,
                    item.quantity,
                    item.unitCost,
                    item.unitPrice,
                    item.subtotal,
                    item.discount,
                    item.total,
                    item.cogs,
                    item.grossProfit,
                ]);
                // Record SALE transaction
                await client.query(`INSERT INTO inventory_transactions (
            organization_id, branch_id, product_id, batch_id,
            source_location_id, transaction_type, quantity, unit_cost,
            reference_id, reference_type, notes, performed_by
          ) VALUES ($1, $2, $3, $4, $5, 'SALE', $6, $7, $8, 'SALE_INVOICE', $9, $10)`, [
                    organizationId,
                    data.branchId,
                    item.productId,
                    item.batchId,
                    data.locationId,
                    item.quantity,
                    item.unitCost,
                    sale.id,
                    `Sale Invoice #${invoiceNumber}`,
                    cashierId,
                ]);
            }
            // 5. Asynchronously trigger smart notification checks for sold products
            for (const pId of productIdsToEvaluate) {
                setTimeout(() => {
                    notifications_service_1.notificationsService.evaluateProductStockAlerts(organizationId, data.branchId, pId).catch(console.error);
                }, 0);
            }
            return {
                sale,
                items: processedItems,
                message: 'Sale completed successfully',
            };
        });
    }
}
exports.SalesService = SalesService;
exports.salesService = new SalesService();
//# sourceMappingURL=sales.service.js.map