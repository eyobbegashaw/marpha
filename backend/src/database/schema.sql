-- Pharmacy Operations & Intelligence Platform - Database Schema
-- Version 2.1 (Streamlined Operational Architecture & Lifecycle Management)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Organizations (Pharmacy Business Entities)
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    tax_id VARCHAR(100),
    phone VARCHAR(50),
    email VARCHAR(100),
    address TEXT,
    currency VARCHAR(10) DEFAULT 'ETB',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Branches
CREATE TABLE IF NOT EXISTS branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(100),
    address TEXT,
    city VARCHAR(100),
    is_main BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_org_branch_code UNIQUE(organization_id, code)
);

-- 3. Roles & Permissions
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) UNIQUE NOT NULL,
    module VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- 4. Users
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    username VARCHAR(100),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(50),
    password_hash VARCHAR(255) NOT NULL,
    language_preference VARCHAR(10) DEFAULT 'en', -- 'en' or 'am'
    is_active BOOLEAN DEFAULT TRUE,
    must_change_password BOOLEAN DEFAULT TRUE,
    reset_token VARCHAR(255),
    reset_token_expires_at TIMESTAMP WITH TIME ZONE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4b. Password Reset Requests
CREATE TABLE IF NOT EXISTS password_reset_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    username VARCHAR(100),
    email VARCHAR(150),
    strategy VARCHAR(50) NOT NULL, -- 'OWNER_RESET' or 'EMAIL_RESET'
    status VARCHAR(50) DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'REJECTED', 'COMPLETED'
    reset_code VARCHAR(50),
    temp_password VARCHAR(255),
    expires_at TIMESTAMP WITH TIME ZONE,
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- 5. Physical Locations (Shelf, Warehouse, Quarantine, etc.)
CREATE TABLE IF NOT EXISTS locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL,
    location_type VARCHAR(50) NOT NULL CHECK (location_type IN ('SALES_SHELF', 'WAREHOUSE', 'DISPENSARY', 'QUARANTINE', 'DAMAGED_STORAGE')),
    is_sales_point BOOLEAN DEFAULT FALSE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_branch_location_code UNIQUE(branch_id, code)
);

-- 6. Categories (Bilingual: EN & AM)
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name_en VARCHAR(100) NOT NULL,
    name_am VARCHAR(100),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Manufacturers
CREATE TABLE IF NOT EXISTS manufacturers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    country VARCHAR(100),
    contact_email VARCHAR(100),
    contact_phone VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Suppliers
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(50),
    address TEXT,
    lead_time_days INTEGER DEFAULT 7,
    payment_terms VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Products (Medicines Master Data - Names remain in English per pharmaceutical standards)
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    manufacturer_id UUID REFERENCES manufacturers(id) ON DELETE SET NULL,
    generic_name VARCHAR(255) NOT NULL, -- English generic name
    brand_name VARCHAR(255),            -- English brand name
    strength VARCHAR(100) NOT NULL,     -- e.g. 500mg, 250mg/5ml
    dosage_form VARCHAR(100) NOT NULL,  -- e.g. Tablet, Syrup, Capsule, Injection, Ointment
    sku VARCHAR(100) NOT NULL,
    barcode VARCHAR(100),
    shelf_min_quantity NUMERIC(12,2) DEFAULT 10.00,
    warehouse_min_quantity NUMERIC(12,2) DEFAULT 20.00,
    default_selling_price NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    prescription_required BOOLEAN DEFAULT FALSE,
    lead_time_days INTEGER DEFAULT 7,
    safety_stock_units NUMERIC(12,2) DEFAULT 20.00,
    unit_of_measure VARCHAR(50) DEFAULT 'Unit',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_org_sku UNIQUE(organization_id, sku)
);

-- 10. Product Price History (Audited Price Management)
CREATE TABLE IF NOT EXISTS product_price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    old_price NUMERIC(12,2) NOT NULL,
    new_price NUMERIC(12,2) NOT NULL,
    reason TEXT,
    changed_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. Medical Information (Bilingual Product Informational Content)
CREATE TABLE IF NOT EXISTS medical_information (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID UNIQUE NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    indications_en TEXT,
    indications_am TEXT,
    contraindications_en TEXT,
    contraindications_am TEXT,
    side_effects_en TEXT,
    side_effects_am TEXT,
    dosage_instructions_en TEXT,
    dosage_instructions_am TEXT,
    storage_info_en TEXT,
    storage_info_am TEXT,
    warnings_en TEXT,
    warnings_am TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. Product Batches (FEFO Tracking & Batch Costing)
CREATE TABLE IF NOT EXISTS product_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    batch_number VARCHAR(100) NOT NULL,
    manufacturing_date DATE,
    expiry_date DATE NOT NULL,
    purchase_cost NUMERIC(12,2) NOT NULL,
    selling_price NUMERIC(12,2) NOT NULL,
    initial_quantity NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    is_quarantined BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_product_batch UNIQUE(product_id, batch_number)
);

-- 13. Inventory (Stock by Location + Batch)
CREATE TABLE IF NOT EXISTS inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES product_batches(id) ON DELETE CASCADE,
    quantity NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (quantity >= 0),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_location_batch UNIQUE(location_id, batch_id)
);

-- 14. Inventory Transactions (Full Audit Trail: RECEIVE, TRANSFER, SALE, DAMAGE, EXPIRED, STOCK_COUNT_ADJUSTMENT)
CREATE TABLE IF NOT EXISTS inventory_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES product_batches(id) ON DELETE CASCADE,
    source_location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    destination_location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('RECEIVE', 'TRANSFER', 'SALE', 'DAMAGE', 'EXPIRED', 'STOCK_COUNT_ADJUSTMENT')),
    quantity NUMERIC(12,2) NOT NULL,
    unit_cost NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    reference_id UUID,
    reference_type VARCHAR(50),
    notes TEXT,
    performed_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 15. Purchases & Purchase Items (Full Procurement Lifecycle: DRAFT -> SUBMITTED -> APPROVED -> ORDERED -> PARTIALLY_RECEIVED -> RECEIVED / CANCELLED)
CREATE TABLE IF NOT EXISTS purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    destination_location_id UUID NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,
    invoice_number VARCHAR(100),
    purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SUBMITTED', 'APPROVED', 'ORDERED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED')),
    subtotal NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    tax_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    ordered_by UUID REFERENCES users(id) ON DELETE SET NULL,
    ordered_at TIMESTAMP WITH TIME ZONE,
    received_by UUID REFERENCES users(id) ON DELETE SET NULL,
    received_at TIMESTAMP WITH TIME ZONE,
    cancelled_by UUID REFERENCES users(id) ON DELETE SET NULL,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS purchase_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    batch_id UUID REFERENCES product_batches(id) ON DELETE SET NULL,
    batch_number VARCHAR(100) NOT NULL,
    manufacturing_date DATE,
    expiry_date DATE NOT NULL,
    quantity_ordered NUMERIC(12,2) NOT NULL,
    quantity_received NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    unit_cost NUMERIC(12,2) NOT NULL,
    unit_selling_price NUMERIC(12,2) NOT NULL,
    total_cost NUMERIC(12,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 16. Sales & Sale Items (POS, Historical Price/Cost Snapshots, User Purchased Records, Offline Idempotency)
CREATE TABLE IF NOT EXISTS sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    location_id UUID NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,
    buyer_id UUID REFERENCES users(id) ON DELETE SET NULL,       -- Purchasing user account (optional)
    cashier_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,  -- Pharmacist / Cashier who dispensed
    invoice_number VARCHAR(100) UNIQUE NOT NULL,
    sale_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    subtotal NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    tax_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    total_cogs NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    gross_profit NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    offline_sync_id VARCHAR(150) UNIQUE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    batch_id UUID NOT NULL REFERENCES product_batches(id) ON DELETE RESTRICT,
    location_id UUID NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,
    quantity NUMERIC(12,2) NOT NULL CHECK (quantity > 0),
    unit_cost NUMERIC(12,2) NOT NULL,     -- Historical snapshot of purchase cost
    unit_price NUMERIC(12,2) NOT NULL,    -- Historical snapshot of selling price
    subtotal NUMERIC(12,2) NOT NULL,
    discount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    total NUMERIC(12,2) NOT NULL,
    cogs NUMERIC(12,2) NOT NULL,          -- quantity * unit_cost
    gross_profit NUMERIC(12,2) NOT NULL,  -- total - cogs
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 17. Expenses (Operating Costs & Void Audit Operations)
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    expense_category VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    recorded_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    is_voided BOOLEAN DEFAULT FALSE,
    void_reason TEXT,
    voided_by UUID REFERENCES users(id) ON DELETE SET NULL,
    voided_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 18. Notifications (Smart Context-Aware Alert System with Read vs Resolved State)
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    target_role VARCHAR(50),
    type VARCHAR(100) NOT NULL CHECK (type IN (
        'SHELF_EMPTY',
        'SHELF_LOW',
        'WAREHOUSE_LOW',
        'COMPLETELY_OUT_OF_STOCK',
        'RESTOCK_RECOMMENDATION',
        'EXPIRY_SOON',
        'EXPIRED',
        'STOCK_RECEIVED',
        'STOCK_ADJUSTMENT',
        'DAILY_SALES_SUMMARY'
    )),
    severity VARCHAR(20) NOT NULL DEFAULT 'INFO' CHECK (severity IN ('INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    title_en VARCHAR(255) NOT NULL,
    title_am VARCHAR(255) NOT NULL,
    message_en TEXT NOT NULL,
    message_am TEXT NOT NULL,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    metadata JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_type VARCHAR(100) NOT NULL,
    is_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_pref_type UNIQUE(user_id, notification_type)
);

-- 19. Tenant Configurations (White-Label Branding, Dynamic Content, Settings & Feature Toggles)
CREATE TABLE IF NOT EXISTS tenant_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
    pharmacy_name VARCHAR(255) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    logo_url TEXT,
    favicon_url TEXT,
    primary_color VARCHAR(50) DEFAULT '#0D9488',
    secondary_color VARCHAR(50) DEFAULT '#0F766E',
    accent_color VARCHAR(50) DEFAULT '#F59E0B',
    background_color VARCHAR(50) DEFAULT '#F8FAFC',
    text_color VARCHAR(50) DEFAULT '#0F172A',
    login_page_branding JSONB DEFAULT '{"title": "Welcome to Pharmacy Operations", "subtitle": "Sign in to access your pharmacy operations", "bannerUrl": null}'::jsonb,
    dashboard_branding JSONB DEFAULT '{"headerTitle": "Pharmacy Management Dashboard", "supportContact": "support@pharmacyops.com"}'::jsonb,
    footer_text TEXT DEFAULT '© 2026 Pharmacy Operations Platform. All rights reserved.',
    description TEXT,
    contact_email VARCHAR(150),
    contact_phone VARCHAR(50),
    address TEXT,
    website VARCHAR(255),
    welcome_message TEXT DEFAULT 'Welcome to our modern healthcare dispensary and pharmacy services.',
    content JSONB DEFAULT '{
      "home.welcome_message": {"en": "Welcome to our Pharmacy", "am": "ወደ ፋርማሲያችን እንኳን በደህና መጡ"},
      "catalog.title": {"en": "Medicines & Healthcare Catalog", "am": "የመድኃኒቶች እና የጤና ምርቶች ዝርዝር"},
      "catalog.description": {"en": "Browse available prescription and over-the-counter medicines in real-time.", "am": "በቅጽበት የሚገኙ የታዘዙ እና ያለሀኪም ትእዛዝ የሚሰጡ መድኃኒቶችን ይመልከቱ።"},
      "contact.title": {"en": "Contact & Location", "am": "አድራሻ እና የስራ ሰዓት"},
      "footer.text": {"en": "Your trusted community healthcare and pharmaceutical partner.", "am": "የታመነ የማህበረሰብ ጤና እና ፋርማሲ አጋርዎ።"}
    }'::jsonb,
    feature_flags JSONB DEFAULT '{
      "public_catalog": true,
      "barcode_lookup": true,
      "customer_purchase_history": true,
      "notifications": true,
      "analytics": true,
      "inventory_management": true,
      "purchasing_procurement": true,
      "offline_sync": true
    }'::jsonb,
    settings JSONB DEFAULT '{
      "default_currency": "ETB",
      "supported_languages": ["en", "am"],
      "default_language": "en",
      "timezone": "Africa/Addis_Ababa",
      "receipt_footer": "Thank you for choosing our pharmacy! Wishing you quick recovery.",
      "tax_rate": 0.15
    }'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 20. Audit Logs (Immutable Security and Operational Activity Log)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_name VARCHAR(100) NOT NULL,
    entity_id VARCHAR(150),
    ip_address VARCHAR(100),
    user_agent TEXT,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_users_org ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_locations_branch ON locations(branch_id);
CREATE INDEX IF NOT EXISTS idx_locations_type ON locations(location_type);
CREATE INDEX IF NOT EXISTS idx_products_org ON products(organization_id);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_price_history_prod ON product_price_history(product_id);
CREATE INDEX IF NOT EXISTS idx_batches_product ON product_batches(product_id);
CREATE INDEX IF NOT EXISTS idx_batches_expiry ON product_batches(expiry_date);
CREATE INDEX IF NOT EXISTS idx_inventory_lookup ON inventory(branch_id, location_id, product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_batch ON inventory(batch_id);
CREATE INDEX IF NOT EXISTS idx_transactions_product ON inventory_transactions(product_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON inventory_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON inventory_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_purchases_branch ON purchases(branch_id, status);
CREATE INDEX IF NOT EXISTS idx_sales_branch_date ON sales(branch_id, sale_date);
CREATE INDEX IF NOT EXISTS idx_sales_buyer ON sales(buyer_id);
CREATE INDEX IF NOT EXISTS idx_sales_offline_id ON sales(offline_sync_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product ON sale_items(product_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_batch ON sale_items(batch_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read, is_resolved);
CREATE INDEX IF NOT EXISTS idx_notifications_branch ON notifications(branch_id, created_at);
CREATE INDEX IF NOT EXISTS idx_expenses_branch ON expenses(branch_id, expense_date);
CREATE INDEX IF NOT EXISTS idx_tenant_config_org ON tenant_configurations(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_org_created ON audit_logs(organization_id, created_at);
