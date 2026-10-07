import { db } from '../../database/connection';

export class AnalyticsService {
  private getDateRange(period: string, customStart?: string, customEnd?: string): { startDate: string; endDate: string; days: number } {
    const end = customEnd ? new Date(customEnd) : new Date();
    let start = new Date();

    switch (period) {
      case 'today':
        start = new Date();
        start.setHours(0, 0, 0, 0);
        break;
      case '7days':
        start.setDate(end.getDate() - 7);
        break;
      case '30days':
        start.setDate(end.getDate() - 30);
        break;
      case '1year':
        start.setFullYear(end.getFullYear() - 1);
        break;
      case 'custom':
        if (customStart) start = new Date(customStart);
        break;
      default:
        start.setDate(end.getDate() - 30);
    }

    const diffTime = Math.abs(end.getTime() - start.getTime());
    const days = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      days,
    };
  }

  async getDashboardSummary(organizationId: string, branchId?: string, period: string = 'today', customStart?: string, customEnd?: string) {
    const { startDate, endDate, days } = this.getDateRange(period, customStart, customEnd);

    let branchFilter = '';
    const params: any[] = [organizationId, startDate, endDate];
    if (branchId) {
      params.push(branchId);
      branchFilter = ` AND branch_id = $${params.length}`;
    }

    // 1. Sales & Profit Metrics
    const salesRes = await db.query(
      `SELECT
         COALESCE(COUNT(id), 0) AS total_sales_count,
         COALESCE(SUM(total_amount), 0) AS total_revenue,
         COALESCE(SUM(total_cogs), 0) AS total_cogs,
         COALESCE(SUM(gross_profit), 0) AS gross_profit,
         COALESCE(AVG(total_amount), 0) AS average_order_value
       FROM sales
       WHERE organization_id = $1 AND sale_date >= $2 AND sale_date <= $3 ${branchFilter}`,
      params
    );

    const unitsSoldRes = await db.query(
      `SELECT COALESCE(SUM(si.quantity), 0) AS total_units_sold
       FROM sale_items si
       JOIN sales s ON si.sale_id = s.id
       WHERE s.organization_id = $1 AND s.sale_date >= $2 AND s.sale_date <= $3 ${branchFilter}`,
      params
    );

    // 2. Expenses Metrics (Excluding voided expenses)
    const expRes = await db.query(
      `SELECT COALESCE(SUM(amount), 0) AS total_expenses
       FROM expenses
       WHERE organization_id = $1 AND expense_date >= $2::date AND expense_date <= $3::date AND is_voided = FALSE ${branchFilter}`,
      params
    );

    const revenue = parseFloat(salesRes.rows[0].total_revenue);
    const cogs = parseFloat(salesRes.rows[0].total_cogs);
    const grossProfit = parseFloat(salesRes.rows[0].gross_profit);
    const expenses = parseFloat(expRes.rows[0].total_expenses);
    const netProfit = grossProfit - expenses;
    const unitsSold = parseFloat(unitsSoldRes.rows[0].total_units_sold);
    const salesCount = parseInt(salesRes.rows[0].total_sales_count, 10);
    const aov = parseFloat(salesRes.rows[0].average_order_value);

    // 3. Current Stock Valuation (Shelf vs Warehouse)
    let invBranchFilter = '';
    const invParams: any[] = [organizationId];
    if (branchId) {
      invParams.push(branchId);
      invBranchFilter = ` AND i.branch_id = $${invParams.length}`;
    }

    const valRes = await db.query(
      `SELECT
         COALESCE(SUM(i.quantity * pb.purchase_cost), 0) AS total_stock_cost_value,
         COALESCE(SUM(i.quantity * pb.selling_price), 0) AS total_stock_retail_value,
         COALESCE(SUM(CASE WHEN l.location_type = 'SALES_SHELF' THEN i.quantity * pb.purchase_cost ELSE 0 END), 0) AS shelf_stock_value,
         COALESCE(SUM(CASE WHEN l.location_type = 'WAREHOUSE' THEN i.quantity * pb.purchase_cost ELSE 0 END), 0) AS warehouse_stock_value
       FROM inventory i
       JOIN product_batches pb ON i.batch_id = pb.id
       JOIN locations l ON i.location_id = l.id
       WHERE i.organization_id = $1 AND i.quantity > 0 ${invBranchFilter}`,
      invParams
    );

    // 4. Inventory Health Status Breakdown
    let healthBranchFilter = '';
    const healthParams: any[] = [organizationId];
    if (branchId) {
      healthParams.push(branchId);
      healthBranchFilter = ` AND (i.branch_id = $${healthParams.length} OR i.branch_id IS NULL)`;
    }

    const healthRes = await db.query(
      `SELECT
         p.id,
         COALESCE(SUM(CASE WHEN l.location_type = 'SALES_SHELF' THEN i.quantity ELSE 0 END), 0) AS shelf_qty,
         COALESCE(SUM(CASE WHEN l.location_type = 'WAREHOUSE' THEN i.quantity ELSE 0 END), 0) AS wh_qty,
         COALESCE(SUM(i.quantity), 0) AS total_qty,
         p.shelf_min_quantity,
         p.warehouse_min_quantity
       FROM products p
       LEFT JOIN inventory i ON p.id = i.product_id ${healthBranchFilter}
       LEFT JOIN locations l ON i.location_id = l.id
       WHERE p.organization_id = $1 AND p.is_active = TRUE
       GROUP BY p.id, p.shelf_min_quantity, p.warehouse_min_quantity`,
      healthParams
    );

    let completelyOutOfStockCount = 0;
    let shelfEmptyRefillRequiredCount = 0;
    let shelfLowCount = 0;
    let warehouseLowCount = 0;
    let availableCount = 0;

    for (const row of healthRes.rows) {
      const sQty = parseFloat(row.shelf_qty);
      const wQty = parseFloat(row.wh_qty);
      const tQty = parseFloat(row.total_qty);
      const sMin = parseFloat(row.shelf_min_quantity);
      const wMin = parseFloat(row.warehouse_min_quantity);

      if (tQty === 0) {
        completelyOutOfStockCount++;
      } else if (sQty === 0 && wQty > 0) {
        shelfEmptyRefillRequiredCount++;
      } else if (sQty <= sMin && wQty > 0) {
        shelfLowCount++;
      } else if (wQty <= wMin) {
        warehouseLowCount++;
      } else {
        availableCount++;
      }
    }

    // 5. Expiry Risk & Lost Stock
    let expInvBranchFilter = '';
    const expRiskParams: any[] = [organizationId];
    if (branchId) {
      expRiskParams.push(branchId);
      expInvBranchFilter = ` AND i.branch_id = $${expRiskParams.length}`;
    }

    const expiryRiskRes = await db.query(
      `SELECT
         COUNT(DISTINCT pb.id) AS expiring_soon_batches,
         COALESCE(SUM(i.quantity), 0) AS expiring_soon_units,
         COALESCE(SUM(i.quantity * pb.purchase_cost), 0) AS expiring_soon_value
       FROM product_batches pb
       JOIN inventory i ON pb.id = i.batch_id
       WHERE pb.organization_id = $1 AND i.quantity > 0 ${expInvBranchFilter}
         AND pb.expiry_date >= CURRENT_DATE AND pb.expiry_date <= CURRENT_DATE + INTERVAL '60 days'`,
      expRiskParams
    );

    let txBranchFilter = '';
    const txParams: any[] = [organizationId, startDate, endDate];
    if (branchId) {
      txParams.push(branchId);
      txBranchFilter = ` AND branch_id = $${txParams.length}`;
    }

    const expiredLostRes = await db.query(
      `SELECT
         COALESCE(SUM(quantity), 0) AS expired_lost_units,
         COALESCE(SUM(quantity * unit_cost), 0) AS expired_lost_cost
       FROM inventory_transactions
       WHERE organization_id = $1 AND transaction_type = 'EXPIRED'
         AND created_at >= $2 AND created_at <= $3 ${txBranchFilter}`,
      txParams
    );

    const damagedLostRes = await db.query(
      `SELECT
         COALESCE(SUM(quantity), 0) AS damaged_lost_units,
         COALESCE(SUM(quantity * unit_cost), 0) AS damaged_lost_cost
       FROM inventory_transactions
       WHERE organization_id = $1 AND transaction_type = 'DAMAGE'
         AND created_at >= $2 AND created_at <= $3 ${txBranchFilter}`,
      txParams
    );

    return {
      period: {
        name: period,
        startDate,
        endDate,
        days,
      },
      financialSummary: {
        revenue,
        cogs,
        grossProfit,
        grossProfitMargin: revenue > 0 ? (grossProfit / revenue) * 100 : 0,
        expenses,
        netProfit,
        netProfitMargin: revenue > 0 ? (netProfit / revenue) * 100 : 0,
        totalSalesCount: salesCount,
        totalUnitsSold: unitsSold,
        averageOrderValue: aov,
      },
      stockValuation: {
        totalStockCostValue: parseFloat(valRes.rows[0].total_stock_cost_value),
        totalStockRetailValue: parseFloat(valRes.rows[0].total_stock_retail_value),
        shelfStockCostValue: parseFloat(valRes.rows[0].shelf_stock_value),
        warehouseStockCostValue: parseFloat(valRes.rows[0].warehouse_stock_value),
      },
      inventoryHealth: {
        totalProducts: healthRes.rows.length,
        availableProducts: availableCount,
        shelfEmptyRefillRequired: shelfEmptyRefillRequiredCount,
        shelfLow: shelfLowCount,
        warehouseLow: warehouseLowCount,
        completelyOutOfStock: completelyOutOfStockCount,
      },
      expiryAndLoss: {
        expiringSoonBatches: parseInt(expiryRiskRes.rows[0].expiring_soon_batches, 10),
        expiringSoonUnits: parseFloat(expiryRiskRes.rows[0].expiring_soon_units),
        expiringSoonValue: parseFloat(expiryRiskRes.rows[0].expiring_soon_value),
        expiredUnitsLostInPeriod: parseFloat(expiredLostRes.rows[0].expired_lost_units),
        expiredCostLostInPeriod: parseFloat(expiredLostRes.rows[0].expired_lost_cost),
        damagedUnitsLostInPeriod: parseFloat(damagedLostRes.rows[0].damaged_lost_units),
        damagedCostLostInPeriod: parseFloat(damagedLostRes.rows[0].damaged_lost_cost),
      },
    };
  }

  async getTopSellingMedicines(organizationId: string, branchId?: string, period: string = '30days', limit: number = 10, customStart?: string, customEnd?: string) {
    const { startDate, endDate } = this.getDateRange(period, customStart, customEnd);
    let branchFilter = '';
    const params: any[] = [organizationId, startDate, endDate];
    if (branchId) {
      params.push(branchId);
      branchFilter = ` AND s.branch_id = $${params.length}`;
    }
    params.push(limit);

    const res = await db.query(
      `SELECT p.id, p.generic_name, p.brand_name, p.strength, p.dosage_form,
              COALESCE(SUM(si.quantity), 0) AS total_units_sold,
              COALESCE(SUM(si.total), 0) AS total_revenue,
              COALESCE(SUM(si.cogs), 0) AS total_cogs,
              COALESCE(SUM(si.gross_profit), 0) AS gross_profit
       FROM sale_items si
       JOIN sales s ON si.sale_id = s.id
       JOIN products p ON si.product_id = p.id
       WHERE s.organization_id = $1 AND s.sale_date >= $2 AND s.sale_date <= $3 ${branchFilter}
       GROUP BY p.id, p.generic_name, p.brand_name, p.strength, p.dosage_form
       ORDER BY total_revenue DESC
       LIMIT $${params.length}`,
      params
    );

    return res.rows.map((r) => ({
      ...r,
      total_units_sold: parseFloat(r.total_units_sold),
      total_revenue: parseFloat(r.total_revenue),
      total_cogs: parseFloat(r.total_cogs),
      gross_profit: parseFloat(r.gross_profit),
    }));
  }

  async getCategorySales(organizationId: string, branchId?: string, period: string = '30days', customStart?: string, customEnd?: string) {
    const { startDate, endDate } = this.getDateRange(period, customStart, customEnd);
    let branchFilter = '';
    const params: any[] = [organizationId, startDate, endDate];
    if (branchId) {
      params.push(branchId);
      branchFilter = ` AND s.branch_id = $${params.length}`;
    }

    const res = await db.query(
      `SELECT COALESCE(c.name_en, 'Uncategorized') AS category_name_en,
              COALESCE(c.name_am, 'ያልተመደበ') AS category_name_am,
              COALESCE(SUM(si.quantity), 0) AS total_units_sold,
              COALESCE(SUM(si.total), 0) AS total_revenue,
              COALESCE(SUM(si.gross_profit), 0) AS gross_profit
       FROM sale_items si
       JOIN sales s ON si.sale_id = s.id
       JOIN products p ON si.product_id = p.id
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE s.organization_id = $1 AND s.sale_date >= $2 AND s.sale_date <= $3 ${branchFilter}
       GROUP BY c.name_en, c.name_am
       ORDER BY total_revenue DESC`,
      params
    );

    return res.rows;
  }

  async getDemandAndReorderRecommendations(organizationId: string, branchId?: string) {
    let branchInvJoin = '';
    let branchSalesFilter = '';
    const params: any[] = [organizationId];

    if (branchId) {
      params.push(branchId);
      branchInvJoin = ` AND i.branch_id = $${params.length}`;
      branchSalesFilter = ` AND s.branch_id = $${params.length}`;
    }

    const res = await db.query(
      `SELECT
         p.id AS product_id, p.generic_name, p.brand_name, p.strength, p.dosage_form,
         p.lead_time_days, p.safety_stock_units, p.shelf_min_quantity, p.warehouse_min_quantity,
         COALESCE(SUM(CASE WHEN l.location_type = 'SALES_SHELF' THEN i.quantity ELSE 0 END), 0) AS shelf_quantity,
         COALESCE(SUM(CASE WHEN l.location_type = 'WAREHOUSE' THEN i.quantity ELSE 0 END), 0) AS warehouse_quantity,
         COALESCE(SUM(i.quantity), 0) AS current_total_stock,
         COALESCE(sold_data.total_sold_30_days, 0) AS total_sold_30_days
       FROM products p
       LEFT JOIN inventory i ON p.id = i.product_id ${branchInvJoin}
       LEFT JOIN locations l ON i.location_id = l.id
       LEFT JOIN (
         SELECT si.product_id, SUM(si.quantity) AS total_sold_30_days
         FROM sale_items si
         JOIN sales s ON si.sale_id = s.id
         WHERE s.organization_id = $1 ${branchSalesFilter} AND s.sale_date >= CURRENT_DATE - INTERVAL '30 days'
         GROUP BY si.product_id
       ) sold_data ON p.id = sold_data.product_id
       WHERE p.organization_id = $1 AND p.is_active = TRUE
       GROUP BY p.id, p.generic_name, p.brand_name, p.strength, p.dosage_form,
                p.lead_time_days, p.safety_stock_units, p.shelf_min_quantity, p.warehouse_min_quantity, sold_data.total_sold_30_days
       ORDER BY sold_data.total_sold_30_days DESC NULLS LAST`,
      params
    );

    return res.rows.map((row) => {
      const totalSold30 = parseFloat(row.total_sold_30_days);
      const ads = totalSold30 / 30; // Average Daily Sales
      const leadTime = row.lead_time_days || 7;
      const safetyStock = parseFloat(row.safety_stock_units || '20');
      const currentStock = parseFloat(row.current_total_stock);
      const shelfStock = parseFloat(row.shelf_quantity);
      const whStock = parseFloat(row.warehouse_quantity);

      const estimatedDemandDuringLeadTime = ads * leadTime;
      const suggestedReorderQuantity = Math.max(0, Math.ceil(estimatedDemandDuringLeadTime + safetyStock - currentStock));
      const daysOfInventoryRemaining = ads > 0 ? (currentStock / ads).toFixed(1) : '999+';

      let urgency: 'NORMAL' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'NORMAL';
      if (currentStock === 0) urgency = 'CRITICAL';
      else if (currentStock <= safetyStock) urgency = 'HIGH';
      else if (suggestedReorderQuantity > 0) urgency = 'MEDIUM';

      return {
        productId: row.product_id,
        genericName: row.generic_name,
        brandName: row.brand_name,
        strength: row.strength,
        dosageForm: row.dosage_form,
        shelfStock,
        warehouseStock: whStock,
        currentStock,
        averageDailySales: parseFloat(ads.toFixed(2)),
        leadTimeDays: leadTime,
        safetyStockUnits: safetyStock,
        estimatedDemandDuringLeadTime: parseFloat(estimatedDemandDuringLeadTime.toFixed(1)),
        suggestedReorderQuantity,
        daysOfInventoryRemaining,
        urgency,
      };
    });
  }
}

export const analyticsService = new AnalyticsService();
