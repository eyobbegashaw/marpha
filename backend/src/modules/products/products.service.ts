import { db } from '../../database/connection';
import { NotFoundError, ConflictError } from '../../common/errors';

export class ProductsService {
  async listProducts(organizationId: string, filters: {
    search?: string;
    categoryId?: string;
    manufacturerId?: string;
    prescriptionRequired?: boolean;
    isActive?: boolean;
    limit?: number;
    offset?: number;
  }) {
    let query = `
      SELECT p.*,
             c.name_en AS category_name_en, c.name_am AS category_name_am,
             m.name AS manufacturer_name,
             COALESCE(SUM(CASE WHEN l.location_type = 'SALES_SHELF' THEN i.quantity ELSE 0 END), 0) AS shelf_quantity,
             COALESCE(SUM(CASE WHEN l.location_type = 'WAREHOUSE' THEN i.quantity ELSE 0 END), 0) AS warehouse_quantity,
             COALESCE(SUM(i.quantity), 0) AS total_quantity
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN manufacturers m ON p.manufacturer_id = m.id
      LEFT JOIN inventory i ON p.id = i.product_id
      LEFT JOIN locations l ON i.location_id = l.id
      WHERE p.organization_id = $1
    `;
    const params: any[] = [organizationId];

    if (filters.search) {
      params.push(`%${filters.search.toLowerCase()}%`);
      query += ` AND (
        LOWER(p.generic_name) LIKE $${params.length} OR
        LOWER(COALESCE(p.brand_name, '')) LIKE $${params.length} OR
        LOWER(p.sku) LIKE $${params.length} OR
        LOWER(COALESCE(p.barcode, '')) LIKE $${params.length}
      )`;
    }

    if (filters.categoryId) {
      params.push(filters.categoryId);
      query += ` AND p.category_id = $${params.length}`;
    }

    if (filters.manufacturerId) {
      params.push(filters.manufacturerId);
      query += ` AND p.manufacturer_id = $${params.length}`;
    }

    if (filters.prescriptionRequired !== undefined) {
      params.push(filters.prescriptionRequired);
      query += ` AND p.prescription_required = $${params.length}`;
    }

    if (filters.isActive !== undefined) {
      params.push(filters.isActive);
      query += ` AND p.is_active = $${params.length}`;
    }

    query += `
      GROUP BY p.id, c.name_en, c.name_am, m.name
      ORDER BY p.generic_name ASC
    `;

    if (filters.limit) {
      params.push(filters.limit);
      query += ` LIMIT $${params.length}`;
    }

    if (filters.offset) {
      params.push(filters.offset);
      query += ` OFFSET $${params.length}`;
    }

    const res = await db.query(query, params);

    // Compute stock status for each product
    return res.rows.map((row) => {
      const shelfQty = parseFloat(row.shelf_quantity);
      const whQty = parseFloat(row.warehouse_quantity);
      const shelfMin = parseFloat(row.shelf_min_quantity);
      const whMin = parseFloat(row.warehouse_min_quantity);

      let status = 'AVAILABLE';
      let recommendedAction = 'Normal operation';

      if (shelfQty === 0 && whQty === 0) {
        status = 'COMPLETELY_OUT_OF_STOCK';
        recommendedAction = 'Send critical alert and recommend purchasing new stock';
      } else if (shelfQty === 0 && whQty > 0) {
        status = 'SHELF_EMPTY';
        recommendedAction = 'Transfer stock from warehouse to shelf; do NOT purchase';
      } else if (shelfQty <= shelfMin && whQty > 0) {
        status = 'SHELF_LOW';
        recommendedAction = 'Prepare transfer from warehouse to shelf';
      } else if (whQty <= whMin) {
        status = 'WAREHOUSE_LOW';
        recommendedAction = 'Replenish warehouse based on demand';
      }

      return {
        ...row,
        shelf_quantity: shelfQty,
        warehouse_quantity: whQty,
        total_quantity: parseFloat(row.total_quantity),
        inventory_status: status,
        recommended_action: recommendedAction,
      };
    });
  }

  async getProductById(organizationId: string, productId: string, isStaff: boolean = false) {
    const res = await db.query(
      `SELECT p.*,
              c.name_en AS category_name_en, c.name_am AS category_name_am,
              m.name AS manufacturer_name,
              mi.indications_en, mi.indications_am,
              mi.contraindications_en, mi.contraindications_am,
              mi.side_effects_en, mi.side_effects_am,
              mi.dosage_instructions_en, mi.dosage_instructions_am,
              mi.storage_info_en, mi.storage_info_am,
              mi.warnings_en, mi.warnings_am
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN manufacturers m ON p.manufacturer_id = m.id
       LEFT JOIN medical_information mi ON p.id = mi.product_id
       WHERE p.organization_id = $1 AND p.id = $2`,
      [organizationId, productId]
    );

    if (res.rows.length === 0) {
      throw new NotFoundError('Medicine not found');
    }

    // Get stock by location and batch
    const inventoryRes = await db.query(
      `SELECT i.quantity, l.name AS location_name, l.code AS location_code, l.location_type, l.is_sales_point,
              b.name AS branch_name, b.city AS branch_city,
              pb.id AS batch_id, pb.batch_number, pb.manufacturing_date, pb.expiry_date,
              pb.selling_price, pb.is_quarantined
              ${isStaff ? ', pb.purchase_cost' : ''}
       FROM inventory i
       JOIN locations l ON i.location_id = l.id
       JOIN branches b ON l.branch_id = b.id
       JOIN product_batches pb ON i.batch_id = pb.id
       WHERE i.product_id = $1 AND i.organization_id = $2 AND i.quantity > 0 AND pb.is_quarantined = FALSE
       ORDER BY pb.expiry_date ASC, l.location_type ASC`,
      [productId, organizationId]
    );

    return {
      product: res.rows[0],
      inventoryLocations: inventoryRes.rows,
    };
  }

  async getProductRealTimeAvailability(organizationId: string, productId: string, branchId?: string) {
    const productRes = await db.query(
      `SELECT p.id, p.generic_name, p.brand_name, p.strength, p.dosage_form,
              p.default_selling_price, p.prescription_required, p.unit_of_measure,
              c.name_en AS category_name_en, c.name_am AS category_name_am
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.organization_id = $1 AND p.id = $2`,
      [organizationId, productId]
    );

    if (productRes.rows.length === 0) {
      throw new NotFoundError('Medicine not found');
    }

    const prod = productRes.rows[0];

    // Branch breakdown
    let branchQuery = `
      SELECT b.id AS branch_id, b.name AS branch_name, b.code AS branch_code, b.city, b.address, b.phone,
             COALESCE(SUM(CASE WHEN l.location_type = 'SALES_SHELF' THEN i.quantity ELSE 0 END), 0) AS shelf_stock,
             COALESCE(SUM(CASE WHEN l.location_type = 'WAREHOUSE' THEN i.quantity ELSE 0 END), 0) AS warehouse_stock,
             COALESCE(SUM(i.quantity), 0) AS total_stock
      FROM branches b
      LEFT JOIN locations l ON b.id = l.branch_id
      LEFT JOIN inventory i ON l.id = i.location_id AND i.product_id = $1
      WHERE b.organization_id = $2 AND b.is_active = TRUE
    `;
    const params: any[] = [productId, organizationId];

    if (branchId) {
      params.push(branchId);
      branchQuery += ` AND b.id = $${params.length}`;
    }

    branchQuery += ` GROUP BY b.id ORDER BY b.is_main DESC, b.name ASC`;

    const branchRes = await db.query(branchQuery, params);

    let totalShelf = 0;
    let totalWarehouse = 0;
    let totalStock = 0;

    const branches = branchRes.rows.map((b) => {
      const s = parseFloat(b.shelf_stock);
      const w = parseFloat(b.warehouse_stock);
      const t = parseFloat(b.total_stock);
      totalShelf += s;
      totalWarehouse += w;
      totalStock += t;

      return {
        branchId: b.branch_id,
        branchName: b.branch_name,
        branchCode: b.branch_code,
        city: b.city,
        address: b.address,
        phone: b.phone,
        shelfStock: s,
        warehouseStock: w,
        totalStock: t,
        isAvailable: t > 0,
        isAvailableOnShelf: s > 0,
        status: t === 0 ? 'OUT_OF_STOCK' : s > 0 ? 'AVAILABLE_FOR_IMMEDIATE_SALE' : 'IN_RESERVE_STORAGE',
      };
    });

    return {
      product: {
        id: prod.id,
        genericName: prod.generic_name,
        brandName: prod.brand_name,
        strength: prod.strength,
        dosageForm: prod.dosage_form,
        category: prod.category_name_en,
        sellingPrice: parseFloat(prod.default_selling_price),
        prescriptionRequired: prod.prescription_required,
        unitOfMeasure: prod.unit_of_measure,
      },
      overallAvailability: {
        isAvailable: totalStock > 0,
        isAvailableOnShelf: totalShelf > 0,
        totalShelfStock: totalShelf,
        totalWarehouseStock: totalWarehouse,
        totalStock: totalStock,
        status: totalStock === 0 ? 'COMPLETELY_OUT_OF_STOCK' : totalShelf > 0 ? 'AVAILABLE' : 'AVAILABLE_IN_WAREHOUSE',
      },
      branches,
    };
  }

  async getProductByBarcode(organizationId: string, barcode: string) {
    const res = await db.query(
      `SELECT p.*,
              c.name_en AS category_name_en, c.name_am AS category_name_am
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.organization_id = $1 AND (p.barcode = $2 OR p.sku = $2)`,
      [organizationId, barcode]
    );

    if (res.rows.length === 0) {
      throw new NotFoundError(`Medicine with barcode/SKU '${barcode}' not found`);
    }

    return res.rows[0];
  }

  async createProduct(organizationId: string, data: any) {
    const existingSku = await db.query(
      'SELECT id FROM products WHERE organization_id = $1 AND sku = $2',
      [organizationId, data.sku]
    );
    if (existingSku.rows.length > 0) {
      throw new ConflictError(`A product with SKU '${data.sku}' already exists in this organization`);
    }

    return await db.withTransaction(async (client) => {
      const pRes = await client.query(
        `INSERT INTO products (
          organization_id, category_id, manufacturer_id, generic_name, brand_name,
          strength, dosage_form, sku, barcode, shelf_min_quantity, warehouse_min_quantity,
          default_selling_price, prescription_required, lead_time_days, safety_stock_units, unit_of_measure
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING *`,
        [
          organizationId,
          data.categoryId || null,
          data.manufacturerId || null,
          data.genericName,
          data.brandName || null,
          data.strength,
          data.dosageForm,
          data.sku,
          data.barcode || null,
          data.shelfMinQuantity ?? 10,
          data.warehouseMinQuantity ?? 20,
          data.defaultSellingPrice,
          data.prescriptionRequired ?? false,
          data.leadTimeDays ?? 7,
          data.safetyStockUnits ?? 20,
          data.unitOfMeasure ?? 'Unit',
        ]
      );
      const product = pRes.rows[0];

      if (data.medicalInfo) {
        await client.query(
          `INSERT INTO medical_information (
            product_id, indications_en, indications_am, contraindications_en, contraindications_am,
            side_effects_en, side_effects_am, dosage_instructions_en, dosage_instructions_am,
            storage_info_en, storage_info_am, warnings_en, warnings_am
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
          [
            product.id,
            data.medicalInfo.indications_en || null,
            data.medicalInfo.indications_am || null,
            data.medicalInfo.contraindications_en || null,
            data.medicalInfo.contraindications_am || null,
            data.medicalInfo.side_effects_en || null,
            data.medicalInfo.side_effects_am || null,
            data.medicalInfo.dosage_instructions_en || null,
            data.medicalInfo.dosage_instructions_am || null,
            data.medicalInfo.storage_info_en || null,
            data.medicalInfo.storage_info_am || null,
            data.medicalInfo.warnings_en || null,
            data.medicalInfo.warnings_am || null,
          ]
        );
      }

      return product;
    });
  }

  async updateProduct(organizationId: string, productId: string, data: any) {
    return await db.withTransaction(async (client) => {
      const pRes = await client.query(
        `UPDATE products
         SET category_id = COALESCE($1, category_id),
             manufacturer_id = COALESCE($2, manufacturer_id),
             generic_name = COALESCE($3, generic_name),
             brand_name = COALESCE($4, brand_name),
             strength = COALESCE($5, strength),
             dosage_form = COALESCE($6, dosage_form),
             barcode = COALESCE($7, barcode),
             shelf_min_quantity = COALESCE($8, shelf_min_quantity),
             warehouse_min_quantity = COALESCE($9, warehouse_min_quantity),
             default_selling_price = COALESCE($10, default_selling_price),
             prescription_required = COALESCE($11, prescription_required),
             lead_time_days = COALESCE($12, lead_time_days),
             safety_stock_units = COALESCE($13, safety_stock_units),
             unit_of_measure = COALESCE($14, unit_of_measure),
             is_active = COALESCE($15, is_active),
             updated_at = CURRENT_TIMESTAMP
         WHERE organization_id = $16 AND id = $17
         RETURNING *`,
        [
          data.categoryId,
          data.manufacturerId,
          data.genericName,
          data.brandName,
          data.strength,
          data.dosageForm,
          data.barcode,
          data.shelfMinQuantity,
          data.warehouseMinQuantity,
          data.defaultSellingPrice,
          data.prescriptionRequired,
          data.leadTimeDays,
          data.safetyStockUnits,
          data.unitOfMeasure,
          data.isActive,
          organizationId,
          productId,
        ]
      );

      if (pRes.rows.length === 0) {
        throw new NotFoundError('Medicine not found');
      }

      if (data.medicalInfo) {
        await client.query(
          `INSERT INTO medical_information (
            product_id, indications_en, indications_am, contraindications_en, contraindications_am,
            side_effects_en, side_effects_am, dosage_instructions_en, dosage_instructions_am,
            storage_info_en, storage_info_am, warnings_en, warnings_am
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          ON CONFLICT (product_id) DO UPDATE
          SET indications_en = EXCLUDED.indications_en,
              indications_am = EXCLUDED.indications_am,
              contraindications_en = EXCLUDED.contraindications_en,
              contraindications_am = EXCLUDED.contraindications_am,
              side_effects_en = EXCLUDED.side_effects_en,
              side_effects_am = EXCLUDED.side_effects_am,
              dosage_instructions_en = EXCLUDED.dosage_instructions_en,
              dosage_instructions_am = EXCLUDED.dosage_instructions_am,
              storage_info_en = EXCLUDED.storage_info_en,
              storage_info_am = EXCLUDED.storage_info_am,
              warnings_en = EXCLUDED.warnings_en,
              warnings_am = EXCLUDED.warnings_am,
              updated_at = CURRENT_TIMESTAMP`,
          [
            productId,
            data.medicalInfo.indications_en,
            data.medicalInfo.indications_am,
            data.medicalInfo.contraindications_en,
            data.medicalInfo.contraindications_am,
            data.medicalInfo.side_effects_en,
            data.medicalInfo.side_effects_am,
            data.medicalInfo.dosage_instructions_en,
            data.medicalInfo.dosage_instructions_am,
            data.medicalInfo.storage_info_en,
            data.medicalInfo.storage_info_am,
            data.medicalInfo.warnings_en,
            data.medicalInfo.warnings_am,
          ]
        );
      }

      return pRes.rows[0];
    });
  }

  async updateProductStatus(organizationId: string, productId: string, isActive: boolean) {
    const res = await db.query(
      `UPDATE products SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE organization_id = $2 AND id = $3 RETURNING *`,
      [isActive, organizationId, productId]
    );
    if (res.rows.length === 0) throw new NotFoundError('Medicine not found');
    return res.rows[0];
  }

  async updateProductPrice(organizationId: string, productId: string, newPrice: number, reason: string | undefined, userId: string) {
    return await db.withTransaction(async (client) => {
      const prodRes = await client.query(
        'SELECT default_selling_price FROM products WHERE organization_id = $1 AND id = $2 FOR UPDATE',
        [organizationId, productId]
      );
      if (prodRes.rows.length === 0) throw new NotFoundError('Medicine not found');
      const oldPrice = parseFloat(prodRes.rows[0].default_selling_price);

      // Update product default_selling_price
      const updatedProdRes = await client.query(
        `UPDATE products SET default_selling_price = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
        [newPrice, productId]
      );

      // Record in product_price_history
      await client.query(
        `INSERT INTO product_price_history (organization_id, product_id, old_price, new_price, reason, changed_by)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [organizationId, productId, oldPrice, newPrice, reason || 'Price update', userId]
      );

      return {
        product: updatedProdRes.rows[0],
        oldPrice,
        newPrice,
        message: 'Product price updated and history recorded',
      };
    });
  }

  async getPriceHistory(organizationId: string, productId: string) {
    const prodRes = await db.query('SELECT id, generic_name FROM products WHERE organization_id = $1 AND id = $2', [organizationId, productId]);
    if (prodRes.rows.length === 0) throw new NotFoundError('Medicine not found');

    const res = await db.query(
      `SELECT pph.*, u.first_name || ' ' || u.last_name AS changed_by_name
       FROM product_price_history pph
       JOIN users u ON pph.changed_by = u.id
       WHERE pph.organization_id = $1 AND pph.product_id = $2
       ORDER BY pph.created_at DESC`,
      [organizationId, productId]
    );
    return res.rows;
  }
}

export const productsService = new ProductsService();
