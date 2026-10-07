import { db } from '../../database/connection';
import { NotFoundError } from '../../common/errors';

export class NotificationsService {
  async listNotifications(organizationId: string, userId?: string, branchId?: string, isRead?: boolean, isResolved?: boolean) {
    let query = `
      SELECT n.*, p.generic_name, p.brand_name, p.strength, p.dosage_form,
             ru.first_name || ' ' || ru.last_name AS resolved_by_name
      FROM notifications n
      LEFT JOIN products p ON n.product_id = p.id
      LEFT JOIN users ru ON n.resolved_by = ru.id
      WHERE n.organization_id = $1
    `;
    const params: any[] = [organizationId];

    if (branchId) {
      params.push(branchId);
      query += ` AND (n.branch_id = $${params.length} OR n.branch_id IS NULL)`;
    }

    if (userId) {
      params.push(userId);
      query += ` AND (n.user_id = $${params.length} OR n.user_id IS NULL)`;
    }

    if (isRead !== undefined) {
      params.push(isRead);
      query += ` AND n.is_read = $${params.length}`;
    }

    if (isResolved !== undefined) {
      params.push(isResolved);
      query += ` AND n.is_resolved = $${params.length}`;
    }

    query += ` ORDER BY n.created_at DESC LIMIT 100`;
    const res = await db.query(query, params);
    return res.rows;
  }

  async markAsRead(organizationId: string, notificationId: string) {
    const res = await db.query(
      `UPDATE notifications
       SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
       WHERE organization_id = $1 AND id = $2
       RETURNING *`,
      [organizationId, notificationId]
    );
    if (res.rows.length === 0) throw new NotFoundError('Notification not found');
    return res.rows[0];
  }

  async markAsResolved(organizationId: string, notificationId: string, userId: string) {
    const res = await db.query(
      `UPDATE notifications
       SET is_resolved = TRUE, resolved_at = CURRENT_TIMESTAMP, resolved_by = $1, is_read = TRUE, read_at = COALESCE(read_at, CURRENT_TIMESTAMP)
       WHERE organization_id = $2 AND id = $3
       RETURNING *`,
      [userId, organizationId, notificationId]
    );
    if (res.rows.length === 0) throw new NotFoundError('Notification not found');
    return res.rows[0];
  }

  async markAllAsRead(organizationId: string, userId?: string) {
    let query = `UPDATE notifications SET is_read = TRUE, read_at = CURRENT_TIMESTAMP WHERE organization_id = $1 AND is_read = FALSE`;
    const params: any[] = [organizationId];
    if (userId) {
      params.push(userId);
      query += ` AND (user_id = $2 OR user_id IS NULL)`;
    }
    await db.query(query, params);
    return { message: 'All notifications marked as read' };
  }

  /**
   * Smart Context-Aware Stock Alert Evaluator
   * Checks Shelf stock, Warehouse stock, thresholds, and recent sales demand
   */
  async evaluateProductStockAlerts(organizationId: string, branchId: string, productId: string) {
    try {
      // 1. Fetch product master data
      const prodRes = await db.query(
        `SELECT id, generic_name, brand_name, strength, dosage_form,
                shelf_min_quantity, warehouse_min_quantity, lead_time_days, safety_stock_units
         FROM products
         WHERE organization_id = $1 AND id = $2`,
        [organizationId, productId]
      );

      if (prodRes.rows.length === 0) return;
      const product = prodRes.rows[0];

      // 2. Fetch current stock by location type in this branch
      const stockRes = await db.query(
        `SELECT
           COALESCE(SUM(CASE WHEN l.location_type = 'SALES_SHELF' THEN i.quantity ELSE 0 END), 0) AS shelf_quantity,
           COALESCE(SUM(CASE WHEN l.location_type = 'WAREHOUSE' THEN i.quantity ELSE 0 END), 0) AS warehouse_quantity,
           COALESCE(SUM(i.quantity), 0) AS total_quantity
         FROM inventory i
         JOIN locations l ON i.location_id = l.id
         WHERE i.organization_id = $1 AND i.branch_id = $2 AND i.product_id = $3`,
        [organizationId, branchId, productId]
      );

      const shelfQty = parseFloat(stockRes.rows[0]?.shelf_quantity || '0');
      const whQty = parseFloat(stockRes.rows[0]?.warehouse_quantity || '0');
      const totalQty = parseFloat(stockRes.rows[0]?.total_quantity || '0');
      const shelfMin = parseFloat(product.shelf_min_quantity);
      const whMin = parseFloat(product.warehouse_min_quantity);

      const prodLabel = `${product.generic_name} ${product.strength}`;

      // 3. Evaluate Status & Create Context-Aware Notifications
      if (totalQty === 0) {
        // Completely Out of Stock across all locations in branch
        await this.createNotification({
          organizationId,
          branchId,
          productId,
          type: 'COMPLETELY_OUT_OF_STOCK',
          severity: 'CRITICAL',
          title_en: '🔴 Out of Stock',
          title_am: '🔴 መድሃኒቱ ሙሉ በሙሉ አልቋል',
          message_en: `Out of Stock — ${prodLabel}. Shelf: 0. Warehouse: 0. No units are available throughout the pharmacy.`,
          message_am: `መድሃኒቱ አልቋል — ${prodLabel}። በመደርደሪያ: 0። በመጋዘን: 0። በፋርማሲው ውስጥ ምንም ክምችት የለም።`,
          metadata: { shelfQty, whQty, totalQty, requiredAction: 'PURCHASE' },
        });
      } else if (shelfQty === 0 && whQty > 0) {
        // Shelf is empty, but Warehouse has stock -> Recommend Shelf Refill (DO NOT purchase)
        await this.createNotification({
          organizationId,
          branchId,
          productId,
          type: 'SHELF_EMPTY',
          severity: 'MEDIUM',
          title_en: '🟡 Shelf Stock Empty',
          title_am: '🟡 በመደርደሪያ ላይ ያለ መድሃኒት አልቋል',
          message_en: `Shelf Stock Empty — ${prodLabel}. Shelf: 0 units. Warehouse: ${whQty} units. Refill the sales shelf from the warehouse.`,
          message_am: `የመደርደሪያ ክምችት አልቋል — ${prodLabel}። በመደርደሪያ: 0። በመጋዘን: ${whQty} ፍሬ አለ። እባክዎ ከመጋዘን ወደ መደርደሪያ ያዘዋውሩ።`,
          metadata: { shelfQty, whQty, totalQty, requiredAction: 'TRANSFER_FROM_WAREHOUSE' },
        });
      } else if (shelfQty <= shelfMin && whQty > 0) {
        // Shelf is low
        await this.createNotification({
          organizationId,
          branchId,
          productId,
          type: 'SHELF_LOW',
          severity: 'LOW',
          title_en: '🟡 Shelf Stock Low',
          title_am: '🟡 በመደርደሪያ ላይ ያለ መድሃኒት አነስተኛ ነው',
          message_en: `Shelf Stock Low — ${prodLabel}. Shelf: ${shelfQty} units (min: ${shelfMin}). Warehouse: ${whQty} units. Consider refilling shelf.`,
          message_am: `የመደርደሪያ ክምችት አነስተኛ ነው — ${prodLabel}። በመደርደሪያ: ${shelfQty} (ዝቅተኛ ገደብ: ${shelfMin})። በመጋዘን: ${whQty}።`,
          metadata: { shelfQty, whQty, shelfMin, requiredAction: 'TRANSFER_FROM_WAREHOUSE' },
        });
      } else if (whQty <= whMin) {
        // Warehouse stock is low -> evaluate demand and reorder recommendations
        const sales30Days = await db.query(
          `SELECT COALESCE(SUM(si.quantity), 0) AS total_sold
           FROM sale_items si
           JOIN sales s ON si.sale_id = s.id
           WHERE s.organization_id = $1 AND s.branch_id = $2 AND si.product_id = $3
             AND s.sale_date >= CURRENT_DATE - INTERVAL '30 days'`,
          [organizationId, branchId, productId]
        );

        const totalSold = parseFloat(sales30Days.rows[0]?.total_sold || '0');
        const ads = totalSold / 30; // Average daily sales
        const leadTimeDays = product.lead_time_days || 7;
        const safetyStock = parseFloat(product.safety_stock_units || '20');
        const demandDuringLeadTime = ads * leadTimeDays;
        const suggestedReorder = Math.max(0, Math.ceil(demandDuringLeadTime + safetyStock - totalQty));

        await this.createNotification({
          organizationId,
          branchId,
          productId,
          type: 'WAREHOUSE_LOW',
          severity: 'HIGH',
          title_en: '🟠 Warehouse Stock Low',
          title_am: '🟠 በመጋዘን ውስጥ ያለ መድሃኒት አነስተኛ ነው',
          message_en: `Warehouse Stock Low — ${prodLabel}. Shelf: ${shelfQty} units. Warehouse: ${whQty} units (min: ${whMin}). Recent sales indicate ~${ads.toFixed(1)} units/day. Suggested reorder: ${suggestedReorder} units.`,
          message_am: `የመጋዘን ክምችት አነስተኛ ነው — ${prodLabel}። በመደርደሪያ: ${shelfQty}። በመጋዘን: ${whQty}። የቅርብ ሽያጭ በቀን ~${ads.toFixed(1)} ያሳያል። የሚመከር ትዕዛዝ: ${suggestedReorder} ፍሬ።`,
          metadata: { shelfQty, whQty, whMin, ads, suggestedReorder, leadTimeDays, safetyStock, requiredAction: 'PURCHASE' },
        });
      }
    } catch (err) {
      console.error('Error evaluating product stock alerts:', err);
    }
  }

  /**
   * Evaluates all batch expiries in the organization
   */
  async evaluateExpiryAlerts(organizationId: string) {
    try {
      // Find batches expiring within 60 days
      const expiringRes = await db.query(
        `SELECT pb.id, pb.batch_number, pb.expiry_date, p.id AS product_id, p.generic_name, p.strength,
                COALESCE(SUM(i.quantity), 0) AS remaining_stock
         FROM product_batches pb
         JOIN products p ON pb.product_id = p.id
         LEFT JOIN inventory i ON pb.id = i.batch_id
         WHERE pb.organization_id = $1 AND pb.expiry_date <= CURRENT_DATE + INTERVAL '60 days'
         GROUP BY pb.id, pb.batch_number, pb.expiry_date, p.id, p.generic_name, p.strength
         HAVING COALESCE(SUM(i.quantity), 0) > 0`,
        [organizationId]
      );

      for (const row of expiringRes.rows) {
        const isExpired = new Date(row.expiry_date) < new Date();
        const type = isExpired ? 'EXPIRED' : 'EXPIRY_SOON';
        const severity = isExpired ? 'CRITICAL' : 'HIGH';
        const prodLabel = `${row.generic_name} ${row.strength}`;

        await this.createNotification({
          organizationId,
          productId: row.product_id,
          type,
          severity,
          title_en: isExpired ? '🚫 Medicine Expired' : '⚠️ Medicine Expiring Soon',
          title_am: isExpired ? '🚫 ጊዜው ያለፈበት መድሃኒት' : '⚠️ በቅርቡ ጊዜው የሚያልፍበት መድሃኒት',
          message_en: isExpired
            ? `Batch ${row.batch_number} of ${prodLabel} expired on ${row.expiry_date.toISOString().split('T')[0]}. Remaining stock: ${row.remaining_stock} units. Blocked from sale.`
            : `Batch ${row.batch_number} of ${prodLabel} expires on ${row.expiry_date.toISOString().split('T')[0]}. Remaining stock: ${row.remaining_stock} units. Prioritize FEFO dispensation.`,
          message_am: isExpired
            ? `የመድሃኒት ባች ${row.batch_number} (${prodLabel}) በ ${row.expiry_date.toISOString().split('T')[0]} ጊዜው አልፏል። የቀረው ክምችት: ${row.remaining_stock}። ከሽያጭ ታግዷል።`
            : `የመድሃኒት ባች ${row.batch_number} (${prodLabel}) በ ${row.expiry_date.toISOString().split('T')[0]} ጊዜው ያልፋል። የቀረው ክምችት: ${row.remaining_stock}። በቅድሚያ ይሸጥ።`,
          metadata: { batchId: row.id, batchNumber: row.batch_number, expiryDate: row.expiry_date, remainingStock: row.remaining_stock },
        });
      }
    } catch (err) {
      console.error('Error evaluating expiry alerts:', err);
    }
  }

  async createNotification(data: {
    organizationId: string;
    branchId?: string;
    userId?: string;
    targetRole?: string;
    type: string;
    severity: 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    title_en: string;
    title_am: string;
    message_en: string;
    message_am: string;
    productId?: string;
    metadata?: Record<string, any>;
  }) {
    // Check if an unread/unresolved notification of the same type and product was already created in last 2 hours to prevent spam
    if (data.productId) {
      const recent = await db.query(
        `SELECT id FROM notifications
         WHERE organization_id = $1 AND product_id = $2 AND type = $3 AND is_resolved = FALSE
           AND created_at >= NOW() - INTERVAL '2 hours'`,
        [data.organizationId, data.productId, data.type]
      );
      if (recent.rows.length > 0) return recent.rows[0];
    }

    const res = await db.query(
      `INSERT INTO notifications (
        organization_id, branch_id, user_id, target_role, type, severity,
        title_en, title_am, message_en, message_am, product_id, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        data.organizationId,
        data.branchId || null,
        data.userId || null,
        data.targetRole || null,
        data.type,
        data.severity,
        data.title_en,
        data.title_am,
        data.message_en,
        data.message_am,
        data.productId || null,
        data.metadata ? JSON.stringify(data.metadata) : null,
      ]
    );

    return res.rows[0];
  }
}

export const notificationsService = new NotificationsService();
