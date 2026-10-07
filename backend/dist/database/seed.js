"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedDatabase = seedDatabase;
const connection_1 = require("./connection");
const hashHelper_1 = require("../common/utils/hashHelper");
const migrate_1 = require("./migrate");
const notifications_service_1 = require("../modules/notifications/notifications.service");
async function seedDatabase() {
    console.log('🌱 Starting comprehensive database seeding...');
    // Ensure tables exist
    await (0, migrate_1.runMigrations)();
    await connection_1.db.withTransaction(async (client) => {
        // 1. Roles (Consolidated: PLATFORM_ADMIN, PHARMACY_OWNER, PHARMACIST, CUSTOMER)
        console.log('Inserting Roles & Permissions...');
        const roles = [
            { name: 'PLATFORM_ADMIN', desc: 'Platform Product Administrator managing multi-tenant pharmacy configurations, white-label branding, and platform feature flags' },
            { name: 'PHARMACY_OWNER', desc: 'Pharmacy Business Owner managing pharmacy operations, inventory, employees, and finances' },
            { name: 'PHARMACIST', desc: 'Licensed Pharmacist & Cashier managing sales, dispensing, shelf transfers, and stock operations' },
            { name: 'CUSTOMER', desc: 'Customer with public viewing and medicine information search access' },
        ];
        const roleMap = new Map();
        for (const r of roles) {
            const res = await client.query(`INSERT INTO roles (name, description, is_system)
         VALUES ($1, $2, TRUE)
         ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description
         RETURNING id, name`, [r.name, r.desc]);
            roleMap.set(res.rows[0].name, res.rows[0].id);
        }
        // 2. Permissions
        const permissions = [
            { code: 'inventory:view', module: 'inventory', desc: 'View inventory and stock levels' },
            { code: 'inventory:transfer', module: 'inventory', desc: 'Transfer stock between shelf and warehouse' },
            { code: 'inventory:adjust', module: 'inventory', desc: 'Adjust stock count' },
            { code: 'pos:sell', module: 'sales', desc: 'Execute POS sales and refunds' },
            { code: 'pos:return', module: 'sales', desc: 'Process sales refunds' },
            { code: 'purchases:manage', module: 'purchases', desc: 'Create and receive purchase orders' },
            { code: 'products:manage', module: 'products', desc: 'Create and edit medicines' },
            { code: 'reports:view', module: 'analytics', desc: 'View analytics and reports' },
            { code: 'users:manage', module: 'users', desc: 'Manage employees' },
        ];
        for (const p of permissions) {
            const permRes = await client.query(`INSERT INTO permissions (code, module, description)
         VALUES ($1, $2, $3)
         ON CONFLICT (code) DO UPDATE SET description = EXCLUDED.description
         RETURNING id`, [p.code, p.module, p.desc]);
            const permId = permRes.rows[0].id;
            // Assign all to PHARMACY_OWNER
            await client.query(`INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [roleMap.get('PHARMACY_OWNER'), permId]);
            // Assign operational permissions to PHARMACIST
            if (['inventory:view', 'inventory:transfer', 'inventory:adjust', 'pos:sell', 'pos:return', 'purchases:manage', 'products:manage', 'reports:view'].includes(p.code)) {
                await client.query(`INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [roleMap.get('PHARMACIST'), permId]);
            }
        }
        // 3. Organization
        console.log('Inserting Organization & Branches...');
        const orgRes = await client.query(`INSERT INTO organizations (name, code, tax_id, phone, email, address, currency)
       VALUES ('Selam Central Pharmacy', 'SELAM-01', 'TIN-987654321', '+251115512233', 'contact@selampharmacy.com', 'Churchill Avenue, Addis Ababa', 'ETB')
       ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`, []);
        const orgId = orgRes.rows[0].id;
        // 4. Branches
        const mainBranchRes = await client.query(`INSERT INTO branches (organization_id, name, code, phone, email, address, city, is_main)
       VALUES ($1, 'Main Central Branch', 'MAIN', '+251115512233', 'main@selampharmacy.com', 'Churchill Ave', 'Addis Ababa', TRUE)
       ON CONFLICT (organization_id, code) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`, [orgId]);
        const mainBranchId = mainBranchRes.rows[0].id;
        const boleBranchRes = await client.query(`INSERT INTO branches (organization_id, name, code, phone, email, address, city, is_main)
       VALUES ($1, 'Bole Branch', 'BOLE', '+251116624455', 'bole@selampharmacy.com', 'Bole Medhanialem', 'Addis Ababa', FALSE)
       ON CONFLICT (organization_id, code) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`, [orgId]);
        const boleBranchId = boleBranchRes.rows[0].id;
        // 5. Locations (Sales Shelf vs Warehouse)
        console.log('Inserting Physical Locations...');
        const locMap = new Map();
        const locationsData = [
            { branchId: mainBranchId, name: 'Main Sales Shelf', code: 'SHELF-01', type: 'SALES_SHELF', isSales: true, desc: 'Customer facing retail sales counter' },
            { branchId: mainBranchId, name: 'Main Warehouse', code: 'WH-01', type: 'WAREHOUSE', isSales: false, desc: 'Central back storage reserve warehouse' },
            { branchId: mainBranchId, name: 'Quarantine Storage', code: 'QUAR-01', type: 'QUARANTINE', isSales: false, desc: 'Quarantined and expired medicine hold area' },
            { branchId: boleBranchId, name: 'Bole Sales Shelf', code: 'BOLE-SHELF', type: 'SALES_SHELF', isSales: true, desc: 'Bole branch front sales shelf' },
            { branchId: boleBranchId, name: 'Bole Warehouse', code: 'BOLE-WH', type: 'WAREHOUSE', isSales: false, desc: 'Bole branch storage warehouse' },
        ];
        for (const loc of locationsData) {
            const lRes = await client.query(`INSERT INTO locations (organization_id, branch_id, name, code, location_type, is_sales_point, description)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (branch_id, code) DO UPDATE SET name = EXCLUDED.name
         RETURNING id, code`, [orgId, loc.branchId, loc.name, loc.code, loc.type, loc.isSales, loc.desc]);
            locMap.set(lRes.rows[0].code, lRes.rows[0].id);
        }
        const shelfId = locMap.get('SHELF-01');
        const whId = locMap.get('WH-01');
        // 6. Users
        console.log('Inserting Users...');
        const passwordHash = await hashHelper_1.hashHelper.hash('Password123!');
        const platformAdminHash = await hashHelper_1.hashHelper.hash('PlatformAdmin123!');
        // Platform Admin User (Global, organization_id is NULL)
        await client.query(`INSERT INTO users (organization_id, branch_id, role_id, first_name, last_name, email, password_hash, language_preference)
       VALUES (NULL, NULL, $1, 'Platform', 'Administrator', 'admin@pharmaplatform.com', $2, 'en')
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash`, [roleMap.get('PLATFORM_ADMIN'), platformAdminHash]);
        const usersData = [
            { email: 'owner@selampharmacy.com', role: 'PHARMACY_OWNER', first: 'Abebe', last: 'Kebede', branchId: mainBranchId },
            { email: 'pharmacist@selampharmacy.com', role: 'PHARMACIST', first: 'Tadesse', last: 'Mekonnen', branchId: mainBranchId },
            { email: 'customer@gmail.com', role: 'CUSTOMER', first: 'Almaz', last: 'Bekele', branchId: null },
        ];
        const userMap = new Map();
        for (const u of usersData) {
            const uRes = await client.query(`INSERT INTO users (organization_id, branch_id, role_id, first_name, last_name, email, password_hash, language_preference)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'en')
         ON CONFLICT (email) DO UPDATE SET first_name = EXCLUDED.first_name
         RETURNING id, email`, [orgId, u.branchId, roleMap.get(u.role), u.first, u.last, u.email, passwordHash]);
            userMap.set(u.email, uRes.rows[0].id);
        }
        const pharmacistId = userMap.get('pharmacist@selampharmacy.com');
        const cashierId = pharmacistId; // Pharmacist performs dispensing and cashiering
        // 7. Categories (Bilingual: English + Amharic)
        console.log('Inserting Bilingual Categories...');
        const categoriesData = [
            { en: 'Analgesics & Antipyretics', am: 'የህመም ማስታገሻዎች እና የትኩሳት መድሃኒቶች', desc: 'Pain relievers and fever reducers' },
            { en: 'Antibiotics', am: 'አንቲባዮቲኮች (የባክቴሪያ መከላከያ)', desc: 'Antibacterial medications' },
            { en: 'Antidiabetics', am: 'የስኳር ህመም መድሃኒቶች', desc: 'Blood sugar regulating medications' },
            { en: 'Gastrointestinal & Antacids', am: 'የጨጓራ እና የአንጀት መድሃኒቶች', desc: 'Acidity, reflux and stomach treatments' },
            { en: 'Cardiovascular', am: 'የልብ እና የደም ግፊት መድሃኒቶች', desc: 'Hypertension and heart health medications' },
        ];
        const catMap = new Map();
        for (const c of categoriesData) {
            const cRes = await client.query(`INSERT INTO categories (organization_id, name_en, name_am, description)
         VALUES ($1, $2, $3, $4)
         RETURNING id, name_en`, [orgId, c.en, c.am, c.desc]);
            catMap.set(c.en, cRes.rows[0].id);
        }
        // 8. Manufacturers & Suppliers
        console.log('Inserting Manufacturers & Suppliers...');
        const mRes = await client.query(`INSERT INTO manufacturers (organization_id, name, country)
       VALUES
       ($1, 'Ethiopian Pharmaceuticals Mfg (EPHARM)', 'Ethiopia'),
       ($1, 'Cadila Pharmaceuticals', 'India'),
       ($1, 'GlaxoSmithKline (GSK)', 'United Kingdom'),
       ($1, 'Novartis', 'Switzerland')
       RETURNING id, name`, [orgId]);
        const ephramId = mRes.rows[0].id;
        const cadilaId = mRes.rows[1].id;
        const sRes = await client.query(`INSERT INTO suppliers (organization_id, name, contact_person, phone, email, lead_time_days)
       VALUES
       ($1, 'Ethio-Pharm Wholesale Distributors', 'Dawit Haile', '+251911002233', 'orders@ethiopharm.com', 5),
       ($1, 'Afro Health Medical Supplies', 'Sara Mengistu', '+251922446688', 'sales@afrohealth.et', 7)
       RETURNING id, name`, [orgId]);
        const supplierId = sRes.rows[0].id;
        // 9. Products (Medicines Master Data - Names remain in English per requirements)
        console.log('Inserting Products & Medical Info...');
        const productsData = [
            {
                sku: 'MED-PARA-500',
                generic: 'Paracetamol',
                brand: 'Panadol Extra',
                strength: '500mg',
                form: 'Tablet',
                barcode: '6001234567891',
                shelfMin: 10,
                whMin: 20,
                price: 100,
                rx: false,
                cat: 'Analgesics & Antipyretics',
                man: ephramId,
                lead: 5,
                safety: 20,
                medical: {
                    indications_en: 'Relief of mild to moderate pain (headaches, toothache) and reduction of fever.',
                    indications_am: 'መካከለኛ ህመምን ለማስታገስ (ራስ ምታት፣ ጥርስ ህመም) እና ትኩሳትን ለመቀነስ።',
                    contraindications_en: 'Severe active hepatic disease or severe renal impairment.',
                    contraindications_am: 'ከባድ የጉበት ወይም የኩላሊት ህመም ላለባቸው አይመከርም።',
                    side_effects_en: 'Rare allergic skin reactions, nausea.',
                    side_effects_am: 'አልፎ አልፎ የቆዳ ማሳከክ፣ የማቅለሽለሽ ስሜት።',
                    dosage_instructions_en: 'Adults: 500mg - 1000mg every 4 to 6 hours as needed. Max 4000mg per 24 hours.',
                    dosage_instructions_am: 'አዋቂዎች: 1-2 እንክብል በየ 4-6 ሰዓቱ እንደ አስፈላጊነቱ። በቀን ከ 4000mg ያልበለጠ።',
                    storage_info_en: 'Store below 30°C in a dry place protected from direct sunlight.',
                    storage_info_am: 'ከ 30 ዲግሪ ሴንቲግሬድ በታች በደረቅ ቦታ እና ከፀሐይ ብርሃን ርቆ ይቀመጥ።',
                    warnings_en: 'Do not take concurrently with other paracetamol-containing products.',
                    warnings_am: 'ፓራሲታሞል ካላቸው ሌሎች መድሃኒቶች ጋር በአንድ ላይ አይውሰዱ።',
                },
            },
            {
                sku: 'MED-AMOX-500',
                generic: 'Amoxicillin',
                brand: 'Amoxil',
                strength: '500mg',
                form: 'Capsule',
                barcode: '6001234567892',
                shelfMin: 15,
                whMin: 30,
                price: 150,
                rx: true,
                cat: 'Antibiotics',
                man: ephramId,
                lead: 7,
                safety: 30,
                medical: {
                    indications_en: 'Treatment of bacterial infections including otitis media, strep throat, pneumonia, and skin infections.',
                    indications_am: 'በባክቴሪያ የሚመጡ የሳንባ፣ የጉሮሮ፣ የጆሮ እና የቆዳ ኢንፌክሽኖችን ለማከም።',
                    contraindications_en: 'Hypersensitivity to penicillin or cephalosporin antibiotics.',
                    contraindications_am: 'የፔኒሲሊን ወይም የሴፋሎስፖሪን አለርጂ ላለባቸው የተከለከለ ነው።',
                    dosage_instructions_en: '500mg every 8 hours for 7-10 days as prescribed.',
                    dosage_instructions_am: '500mg በየ 8 ሰዓቱ ለ 7-10 ቀናት በሃኪም ትእዛዝ መሰረት።',
                },
            },
            {
                sku: 'MED-MET-500',
                generic: 'Metformin',
                brand: 'Glucophage',
                strength: '500mg',
                form: 'Tablet',
                barcode: '6001234567893',
                shelfMin: 20,
                whMin: 40,
                price: 85,
                rx: true,
                cat: 'Antidiabetics',
                man: cadilaId,
                lead: 7,
                safety: 40,
            },
            {
                sku: 'MED-OMEP-20',
                generic: 'Omeprazole',
                brand: 'Prilosec',
                strength: '20mg',
                form: 'Capsule',
                barcode: '6001234567894',
                shelfMin: 10,
                whMin: 25,
                price: 120,
                rx: false,
                cat: 'Gastrointestinal & Antacids',
                man: cadilaId,
                lead: 5,
                safety: 25,
            },
            {
                sku: 'MED-CEFT-1G',
                generic: 'Ceftriaxone',
                brand: 'Rocephin',
                strength: '1g',
                form: 'Injection',
                barcode: '6001234567895',
                shelfMin: 5,
                whMin: 10,
                price: 320,
                rx: true,
                cat: 'Antibiotics',
                man: ephramId,
                lead: 10,
                safety: 10,
            },
        ];
        const prodMap = new Map();
        for (const p of productsData) {
            const pRes = await client.query(`INSERT INTO products (
          organization_id, category_id, manufacturer_id, generic_name, brand_name,
          strength, dosage_form, sku, barcode, shelf_min_quantity, warehouse_min_quantity,
          default_selling_price, prescription_required, lead_time_days, safety_stock_units
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        ON CONFLICT (organization_id, sku) DO UPDATE SET generic_name = EXCLUDED.generic_name
        RETURNING id, sku`, [
                orgId,
                catMap.get(p.cat),
                p.man,
                p.generic,
                p.brand,
                p.strength,
                p.form,
                p.sku,
                p.barcode,
                p.shelfMin,
                p.whMin,
                p.price,
                p.rx,
                p.lead,
                p.safety,
            ]);
            const prodId = pRes.rows[0].id;
            prodMap.set(p.sku, prodId);
            if (p.medical) {
                await client.query(`INSERT INTO medical_information (
            product_id, indications_en, indications_am, contraindications_en, contraindications_am,
            side_effects_en, side_effects_am, dosage_instructions_en, dosage_instructions_am,
            storage_info_en, storage_info_am, warnings_en, warnings_am
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          ON CONFLICT (product_id) DO UPDATE SET indications_en = EXCLUDED.indications_en`, [
                    prodId,
                    p.medical.indications_en || null,
                    p.medical.indications_am || null,
                    p.medical.contraindications_en || null,
                    p.medical.contraindications_am || null,
                    p.medical.side_effects_en || null,
                    p.medical.side_effects_am || null,
                    p.medical.dosage_instructions_en || null,
                    p.medical.dosage_instructions_am || null,
                    p.medical.storage_info_en || null,
                    p.medical.storage_info_am || null,
                    p.medical.warnings_en || null,
                    p.medical.warnings_am || null,
                ]);
            }
        }
        // 10. Batches & Location Inventory Setup
        // Reflecting exact scenario from requirements:
        // Paracetamol: Batch B001 (Sales Shelf = 50, Warehouse = 100), Batch B002 (Warehouse = 60)
        // Amoxicillin: Shelf = 10 (Shelf Low), Warehouse = 100
        // Omeprazole: Shelf = 0 (Shelf Empty / Refill Required), Warehouse = 80
        // Ceftriaxone: Shelf = 0, Warehouse = 0 (Completely Out of Stock)
        console.log('Inserting Batches, Shelf & Warehouse Inventory...');
        const paraId = prodMap.get('MED-PARA-500');
        const amoxId = prodMap.get('MED-AMOX-500');
        const metId = prodMap.get('MED-MET-500');
        const omepId = prodMap.get('MED-OMEP-20');
        const ceftId = prodMap.get('MED-CEFT-1G');
        // 10.1 Paracetamol Batches
        const pbB001 = await client.query(`INSERT INTO product_batches (organization_id, product_id, supplier_id, batch_number, manufacturing_date, expiry_date, purchase_cost, selling_price, initial_quantity)
       VALUES ($1, $2, $3, 'B001', '2025-06-01', '2027-06-30', 80.00, 100.00, 150)
       ON CONFLICT (product_id, batch_number) DO UPDATE SET purchase_cost = EXCLUDED.purchase_cost
       RETURNING id`, [orgId, paraId, supplierId]);
        const b001Id = pbB001.rows[0].id;
        const pbB002 = await client.query(`INSERT INTO product_batches (organization_id, product_id, supplier_id, batch_number, manufacturing_date, expiry_date, purchase_cost, selling_price, initial_quantity)
       VALUES ($1, $2, $3, 'B002', '2026-01-01', '2028-01-31', 82.00, 100.00, 60)
       ON CONFLICT (product_id, batch_number) DO UPDATE SET purchase_cost = EXCLUDED.purchase_cost
       RETURNING id`, [orgId, paraId, supplierId]);
        const b002Id = pbB002.rows[0].id;
        // Inventory for Paracetamol: Shelf = 50 (B001), Warehouse = 100 (B001) + 60 (B002)
        await client.query(`INSERT INTO inventory (organization_id, branch_id, location_id, product_id, batch_id, quantity)
       VALUES
       ($1, $2, $3, $4, $5, 50),
       ($1, $2, $6, $4, $5, 100),
       ($1, $2, $6, $4, $7, 60)
       ON CONFLICT (location_id, batch_id) DO UPDATE SET quantity = EXCLUDED.quantity`, [orgId, mainBranchId, shelfId, paraId, b001Id, whId, b002Id]);
        // 10.2 Amoxicillin Batch: Shelf = 10 (Shelf Low!), Warehouse = 100
        const pbAmx = await client.query(`INSERT INTO product_batches (organization_id, product_id, supplier_id, batch_number, manufacturing_date, expiry_date, purchase_cost, selling_price, initial_quantity)
       VALUES ($1, $2, $3, 'AMX-2026', '2026-02-01', '2027-09-30', 110.00, 150.00, 110)
       ON CONFLICT (product_id, batch_number) DO UPDATE SET purchase_cost = EXCLUDED.purchase_cost
       RETURNING id`, [orgId, amoxId, supplierId]);
        const amxBatchId = pbAmx.rows[0].id;
        await client.query(`INSERT INTO inventory (organization_id, branch_id, location_id, product_id, batch_id, quantity)
       VALUES
       ($1, $2, $3, $4, $5, 10),
       ($1, $2, $6, $4, $5, 100)
       ON CONFLICT (location_id, batch_id) DO UPDATE SET quantity = EXCLUDED.quantity`, [orgId, mainBranchId, shelfId, amoxId, amxBatchId, whId]);
        // 10.3 Omeprazole Batch: Shelf = 0 (Shelf Empty / Refill Required!), Warehouse = 80
        const pbOmep = await client.query(`INSERT INTO product_batches (organization_id, product_id, supplier_id, batch_number, manufacturing_date, expiry_date, purchase_cost, selling_price, initial_quantity)
       VALUES ($1, $2, $3, 'OMEP-2026', '2026-03-01', '2027-11-30', 90.00, 120.00, 80)
       ON CONFLICT (product_id, batch_number) DO UPDATE SET purchase_cost = EXCLUDED.purchase_cost
       RETURNING id`, [orgId, omepId, supplierId]);
        const omepBatchId = pbOmep.rows[0].id;
        await client.query(`INSERT INTO inventory (organization_id, branch_id, location_id, product_id, batch_id, quantity)
       VALUES
       ($1, $2, $3, $4, $5, 0),
       ($1, $2, $6, $4, $5, 80)
       ON CONFLICT (location_id, batch_id) DO UPDATE SET quantity = EXCLUDED.quantity`, [orgId, mainBranchId, shelfId, omepId, omepBatchId, whId]);
        // 10.4 Metformin Batch: Shelf = 40, Warehouse = 200
        const pbMet = await client.query(`INSERT INTO product_batches (organization_id, product_id, supplier_id, batch_number, manufacturing_date, expiry_date, purchase_cost, selling_price, initial_quantity)
       VALUES ($1, $2, $3, 'MET-2026', '2026-01-15', '2028-06-30', 60.00, 85.00, 240)
       ON CONFLICT (product_id, batch_number) DO UPDATE SET purchase_cost = EXCLUDED.purchase_cost
       RETURNING id`, [orgId, metId, supplierId]);
        const metBatchId = pbMet.rows[0].id;
        await client.query(`INSERT INTO inventory (organization_id, branch_id, location_id, product_id, batch_id, quantity)
       VALUES
       ($1, $2, $3, $4, $5, 40),
       ($1, $2, $6, $4, $5, 200)
       ON CONFLICT (location_id, batch_id) DO UPDATE SET quantity = EXCLUDED.quantity`, [orgId, mainBranchId, shelfId, metId, metBatchId, whId]);
        // 10.5 Ceftriaxone: Batch exists but 0 stock everywhere -> Completely Out of Stock!
        const pbCeft = await client.query(`INSERT INTO product_batches (organization_id, product_id, supplier_id, batch_number, manufacturing_date, expiry_date, purchase_cost, selling_price, initial_quantity)
       VALUES ($1, $2, $3, 'CEF-2025', '2025-01-01', '2026-12-31', 250.00, 320.00, 0)
       ON CONFLICT (product_id, batch_number) DO UPDATE SET purchase_cost = EXCLUDED.purchase_cost
       RETURNING id`, [orgId, ceftId, supplierId]);
        const ceftBatchId = pbCeft.rows[0].id;
        await client.query(`INSERT INTO inventory (organization_id, branch_id, location_id, product_id, batch_id, quantity)
       VALUES
       ($1, $2, $3, $4, $5, 0),
       ($1, $2, $6, $4, $5, 0)
       ON CONFLICT (location_id, batch_id) DO UPDATE SET quantity = EXCLUDED.quantity`, [orgId, mainBranchId, shelfId, ceftId, ceftBatchId, whId]);
        // 11. Historical Sales & Sales Items (Demonstrating Historical Prices & COGS, linked to buyer user)
        console.log('Inserting Historical Sales & Receipts...');
        const customerUserId = userMap.get('customer@gmail.com') || null;
        const pastSaleRes = await client.query(`INSERT INTO sales (
        organization_id, branch_id, location_id, buyer_id, cashier_id,
        invoice_number, sale_date, subtotal, discount_amount, tax_amount, total_amount,
        total_cogs, gross_profit
      ) VALUES (
        $1, $2, $3, $4, $5,
        'INV-SEED-0001', CURRENT_TIMESTAMP - INTERVAL '2 days', 1000.00, 0, 0, 1000.00,
        800.00, 200.00
      ) ON CONFLICT (invoice_number) DO NOTHING
      RETURNING id`, [orgId, mainBranchId, shelfId, customerUserId, cashierId]);
        if (pastSaleRes.rows.length > 0) {
            const pastSaleId = pastSaleRes.rows[0].id;
            await client.query(`INSERT INTO sale_items (
          sale_id, product_id, batch_id, location_id, quantity,
          unit_cost, unit_price, subtotal, discount, total, cogs, gross_profit
        ) VALUES (
          $1, $2, $3, $4, 10,
          80.00, 100.00, 1000.00, 0, 1000.00, 800.00, 200.00
        )`, [pastSaleId, paraId, b001Id, shelfId]);
        }
        // 12. Product Price History Sample
        console.log('Inserting Product Price History...');
        const ownerUserId = userMap.get('owner@selampharmacy.com');
        await client.query(`INSERT INTO product_price_history (organization_id, product_id, old_price, new_price, reason, changed_by, created_at)
       VALUES ($1, $2, 90.00, 100.00, 'Supplier price adjustment compensation', $3, CURRENT_TIMESTAMP - INTERVAL '15 days')`, [orgId, paraId, ownerUserId]);
        // 13. Purchase Orders (Procurement Lifecycle Sample)
        console.log('Inserting Purchase Orders & Items...');
        const poRes = await client.query(`INSERT INTO purchases (
        organization_id, branch_id, supplier_id, destination_location_id,
        invoice_number, purchase_date, status, subtotal, total_amount, notes,
        created_by, approved_by, approved_at, ordered_by, ordered_at
      ) VALUES (
        $1, $2, $3, $4,
        'PO-2026-0001', CURRENT_DATE - INTERVAL '3 days', 'ORDERED', 8000.00, 8000.00, 'Monthly Paracetamol replenishment',
        $5, $6, CURRENT_TIMESTAMP - INTERVAL '3 days', $5, CURRENT_TIMESTAMP - INTERVAL '2 days'
      ) RETURNING id`, [orgId, mainBranchId, supplierId, whId, pharmacistId, ownerUserId]);
        const poId = poRes.rows[0].id;
        await client.query(`INSERT INTO purchase_items (
        purchase_id, product_id, batch_number, manufacturing_date, expiry_date,
        quantity_ordered, unit_cost, unit_selling_price, total_cost
      ) VALUES ($1, $2, 'B003-RESTOCK', '2026-02-01', '2028-02-28', 100, 80.00, 100.00, 8000.00)`, [poId, paraId]);
        // 14. Operating Expenses
        console.log('Inserting Operating Expenses...');
        await client.query(`INSERT INTO expenses (organization_id, branch_id, expense_category, description, amount, expense_date, recorded_by)
       VALUES
       ($1, $2, 'Utilities', 'Pharmacy monthly electricity bill', 1200.00, CURRENT_DATE - INTERVAL '5 days', $3),
       ($1, $2, 'Supplies', 'Packaging and thermal receipt paper rolls', 450.00, CURRENT_DATE - INTERVAL '2 days', $3)`, [orgId, mainBranchId, pharmacistId]);
        // 15. Tenant Configurations (White-Label Branding, Dynamic Content & Feature Toggles)
        console.log('Inserting Multi-Tenant Configurations for Abu & Butu Pharmacies...');
        // Abu Central Pharmacy Configuration (Teal #0D9488 Branding)
        await client.query(`INSERT INTO tenant_configurations (
        organization_id, pharmacy_name, display_name, logo_url, favicon_url,
        primary_color, secondary_color, accent_color, background_color, text_color,
        login_page_branding, dashboard_branding, footer_text, description,
        contact_email, contact_phone, address, website, welcome_message,
        content, feature_flags, settings
      ) VALUES (
        $1, 'Abu Central Pharmacy', 'Abu Central Pharmacy', 'https://assets.pharmaplatform.com/abu/logo.png', 'https://assets.pharmaplatform.com/abu/favicon.ico',
        '#0D9488', '#0F766E', '#F59E0B', '#F8FAFC', '#0F172A',
        '{"title": "Abu Central Pharmacy - Staff Portal", "subtitle": "Sign in to manage dispensary, sales & stock"}',
        '{"headerTitle": "Abu Pharmacy Operations & Intelligence Dashboard", "supportContact": "support@abupharmacy.com"}',
        '© 2026 Abu Central Pharmacy. Licensed Healthcare Provider.',
        'Abu Central Pharmacy provides community dispensing, essential medicines, and clinical pharmaceutical care.',
        'contact@abupharmacy.com', '+251115512233', 'Churchill Avenue, Addis Ababa', 'https://abupharmacy.com',
        'Welcome to Abu Central Pharmacy — Your trusted community medicine partner.',
        '{
          "home.welcome_message": {"en": "Welcome to Abu Central Pharmacy", "am": "ወደ አቡ ሴንትራል ፋርማሲ እንኳን በደህና መጡ"},
          "catalog.title": {"en": "Abu Pharmacy Medicine Catalog", "am": "የአቡ ፋርማሲ የመድኃኒቶች ዝርዝር"},
          "catalog.description": {"en": "Check live shelf and warehouse availability for all prescription and OTC medicines.", "am": "በቅጽበት የሚገኙ የታዘዙ እና ያለሀኪም ትእዛዝ የሚሰጡ መድኃኒቶችን ይመልከቱ።"},
          "contact.title": {"en": "Visit Abu Pharmacy", "am": "አቡ ፋርማሲን ይጎብኙ"},
          "footer.text": {"en": "Serving our community with genuine pharmaceuticals since 2018.", "am": "ከ2018 ጀምሮ ህብረተሰቡን በታማኝነት እያገለገልን ይገኛል።"}
        }',
        '{
          "public_catalog": true,
          "barcode_lookup": true,
          "customer_purchase_history": true,
          "notifications": true,
          "analytics": true,
          "inventory_management": true,
          "purchasing_procurement": true,
          "offline_sync": true
        }',
        '{
          "default_currency": "ETB",
          "supported_languages": ["en", "am"],
          "default_language": "en",
          "timezone": "Africa/Addis_Ababa",
          "receipt_footer": "Thank you for visiting Abu Central Pharmacy! Wishing you good health.",
          "tax_rate": 0.15
        }'
      ) ON CONFLICT (organization_id) DO UPDATE SET pharmacy_name = EXCLUDED.pharmacy_name`, [orgId]);
        // Butu Community Pharmacy Tenant Creation (Royal Blue #1E40AF Branding)
        const butuOrgRes = await client.query(`INSERT INTO organizations (name, code, tax_id, phone, email, address, currency, is_active)
       VALUES ('Butu Community Pharmacy', 'BUTU-01', 'TIN-112233445', '+251114405566', 'care@butupharmacy.com', 'Debre Zeit Road, Addis Ababa', 'ETB', TRUE)
       ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`, []);
        const butuOrgId = butuOrgRes.rows[0].id;
        const butuBranchRes = await client.query(`INSERT INTO branches (organization_id, name, code, phone, email, address, city, is_main, is_active)
       VALUES ($1, 'Butu Main Branch', 'MAIN', '+251114405566', 'main@butupharmacy.com', 'Debre Zeit Road', 'Addis Ababa', TRUE, TRUE)
       ON CONFLICT (organization_id, code) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`, [butuOrgId]);
        const butuBranchId = butuBranchRes.rows[0].id;
        await client.query(`INSERT INTO locations (organization_id, branch_id, name, code, location_type, is_sales_point, description)
       VALUES
       ($1, $2, 'Butu Sales Shelf', 'SHELF-01', 'SALES_SHELF', TRUE, 'Customer sales dispensary shelf'),
       ($1, $2, 'Butu Main Warehouse', 'WH-01', 'WAREHOUSE', FALSE, 'Reserve warehouse storage')
       ON CONFLICT (branch_id, code) DO NOTHING`, [butuOrgId, butuBranchId]);
        // Butu Owner User
        await client.query(`INSERT INTO users (organization_id, branch_id, role_id, first_name, last_name, email, password_hash, language_preference)
       VALUES ($1, $2, $3, 'Butu', 'Owner', 'owner@butupharmacy.com', $4, 'am')
       ON CONFLICT (email) DO UPDATE SET first_name = EXCLUDED.first_name`, [butuOrgId, butuBranchId, roleMap.get('PHARMACY_OWNER'), passwordHash]);
        // Butu Tenant Configuration
        await client.query(`INSERT INTO tenant_configurations (
        organization_id, pharmacy_name, display_name, logo_url, favicon_url,
        primary_color, secondary_color, accent_color, background_color, text_color,
        login_page_branding, dashboard_branding, footer_text, description,
        contact_email, contact_phone, address, website, welcome_message,
        content, feature_flags, settings
      ) VALUES (
        $1, 'Butu Community Pharmacy', 'Butu Pharmacy', 'https://assets.pharmaplatform.com/butu/logo.png', 'https://assets.pharmaplatform.com/butu/favicon.ico',
        '#1E40AF', '#1E3A8A', '#06B6D4', '#F1F5F9', '#020617',
        '{"title": "Butu Pharmacy Management Suite", "subtitle": "Welcome back! Please enter your staff credentials"}',
        '{"headerTitle": "Butu Pharmacy Operations Portal", "supportContact": "help@butupharmacy.com"}',
        '© 2026 Butu Community Pharmacy. Fast, Reliable and Affordable.',
        'Butu Community Pharmacy specializes in pediatric, maternal, and chronic illness medicine support.',
        'care@butupharmacy.com', '+251114405566', 'Debre Zeit Road, Addis Ababa', 'https://butupharmacy.com',
        'Welcome to Butu Community Pharmacy — Dedicated to Family Health.',
        '{
          "home.welcome_message": {"en": "Welcome to Butu Community Pharmacy", "am": "ወደ ቡቱ ማህበረሰብ ፋርማሲ እንኳን በደህና መጡ"},
          "catalog.title": {"en": "Butu Family Healthcare Catalog", "am": "የቡቱ የቤተሰብ ጤና መድኃኒቶች ዝርዝር"},
          "catalog.description": {"en": "Find medicines with verified expiry and batch tracking.", "am": "የአገልግሎት ጊዜያቸው የተረጋገጠ ጥራት ያላቸውን መድኃኒቶች ያግኙ።"},
          "contact.title": {"en": "Contact Butu Team", "am": "የቡቱ ቡድንን ያግኙ"},
          "footer.text": {"en": "Your neighborhood pharmacy for 24/7 health assistance.", "am": "ለ24/7 የጤና ድጋፍ የሰፈርዎ ፋርማሲ።"}
        }',
        '{
          "public_catalog": false,
          "barcode_lookup": true,
          "customer_purchase_history": true,
          "notifications": true,
          "analytics": true,
          "inventory_management": true,
          "purchasing_procurement": true,
          "offline_sync": false
        }',
        '{
          "default_currency": "ETB",
          "supported_languages": ["en", "am"],
          "default_language": "am",
          "timezone": "Africa/Addis_Ababa",
          "receipt_footer": "Thank you for trusting Butu Community Pharmacy!",
          "tax_rate": 0.15
        }'
      ) ON CONFLICT (organization_id) DO UPDATE SET pharmacy_name = EXCLUDED.pharmacy_name`, [butuOrgId]);
        console.log('✅ Base seed data committed to transaction.');
    });
    // Evaluate smart notifications for seeded products
    console.log('🔔 Generating smart context-aware notifications...');
    const orgRes = await connection_1.db.query('SELECT id FROM organizations LIMIT 1');
    const branchRes = await connection_1.db.query('SELECT id FROM branches LIMIT 1');
    const orgId = orgRes.rows[0].id;
    const branchId = branchRes.rows[0].id;
    const prods = await connection_1.db.query('SELECT id FROM products WHERE organization_id = $1', [orgId]);
    for (const p of prods.rows) {
        await notifications_service_1.notificationsService.evaluateProductStockAlerts(orgId, branchId, p.id);
    }
    await notifications_service_1.notificationsService.evaluateExpiryAlerts(orgId);
    console.log('🎉 Seed process finished successfully! You can log in with:');
    console.log('   🛠️ Platform Admin (White-Label & Multi-Tenant): admin@pharmaplatform.com / PlatformAdmin123!');
    console.log('   👑 Abu Pharmacy Owner (Business Operations): owner@selampharmacy.com / Password123!');
    console.log('   👑 Butu Pharmacy Owner (Business Operations): owner@butupharmacy.com / Password123!');
    console.log('   💊 Pharmacist (Sales & Stock Operations): pharmacist@selampharmacy.com / Password123!');
    console.log('   🛍️ Customer (Public Access, No Login Required): Browse products directly!');
}
if (process.argv[1] && process.argv[1].toLowerCase().includes('seed')) {
    (async () => {
        try {
            await seedDatabase();
            process.exit(0);
        }
        catch (err) {
            console.error('Seed failed:', err);
            process.exit(1);
        }
        finally {
            await connection_1.pool.end();
        }
    })();
}
//# sourceMappingURL=seed.js.map