"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.openApiDocument = void 0;
exports.openApiDocument = {
    openapi: '3.0.0',
    info: {
        title: 'Pharmacy Operations & Intelligence Platform API',
        version: '2.1.0',
        description: `
## Enterprise Pharmacy Operations & Intelligence Platform API Documentation
### Core Architecture & Business Rules:
- **Location-Based Stock**: Strict physical isolation between **Sales Shelf** (dispensing) and **Warehouse / Storage** (reserve).
- **Context-Aware Status**: Shelf = 0 with Warehouse > 0 is *Shelf Empty / Refill Required* (no false purchase alert).
- **Batch & FEFO Tracking**: Automatic dispensation prioritizing batches closest to expiry date; expired batches blocked from sale.
- **Purchase Lifecycle**: \`DRAFT\` → \`SUBMITTED\` → \`APPROVED\` → \`ORDERED\` → \`PARTIALLY_RECEIVED\` → \`RECEIVED\` / \`CANCELLED\` with automatic batch creation upon receipt.
- **Audited Price History**: Product default selling prices are auditable via \`product_price_history\`.
- **Notification State Machine**: Separate \`READ\` (viewed) from \`RESOLVED\` (action taken).
- **Private Inventory Overview**: Staff-only stock overview; public users access only specific product availability (\`/products/:id/availability\`).
- **User Purchased History**: Authenticated users can view their own purchase receipts (\`/sales/my-purchases\`).
- **Bilingual Interface**: Full Amharic & English support with pharmaceutical standard English medicine names.
- **Smart Analytics**: Real-time COGS, gross/net profit, ADS demand calculation, stock valuation, and expiry risk monitoring with branch and date filters.
    `,
    },
    servers: [
        {
            url: '/api/v1',
            description: 'API v1 Endpoint',
        },
    ],
    components: {
        securitySchemes: {
            BearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                description: 'Enter your JWT authorization token (e.g. `Bearer eyJhbGci...`)',
            },
        },
        schemas: {
            ApiResponse: {
                type: 'object',
                properties: {
                    success: { type: 'boolean' },
                    statusCode: { type: 'integer' },
                    message: { type: 'string' },
                    data: { type: 'object' },
                    timestamp: { type: 'string', format: 'date-time' },
                },
            },
            RegisterRequest: {
                type: 'object',
                required: ['organizationName', 'organizationCode', 'branchName', 'branchCode', 'firstName', 'lastName', 'email', 'password'],
                properties: {
                    organizationName: { type: 'string', example: 'Selam Central Pharmacy' },
                    organizationCode: { type: 'string', example: 'SELAM-01' },
                    branchName: { type: 'string', example: 'Main Branch' },
                    branchCode: { type: 'string', example: 'MAIN' },
                    firstName: { type: 'string', example: 'Abebe' },
                    lastName: { type: 'string', example: 'Kebede' },
                    email: { type: 'string', format: 'email', example: 'owner@selampharmacy.com' },
                    phone: { type: 'string', example: '+251911223344' },
                    password: { type: 'string', example: 'Password123!' },
                    languagePreference: { type: 'string', enum: ['en', 'am'], default: 'en' },
                },
            },
            LoginRequest: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                    email: { type: 'string', format: 'email', example: 'owner@selampharmacy.com' },
                    password: { type: 'string', example: 'Password123!' },
                },
            },
            CreateUserRequest: {
                type: 'object',
                required: ['roleName', 'firstName', 'lastName', 'email', 'password'],
                properties: {
                    branchId: { type: 'string', format: 'uuid' },
                    roleName: { type: 'string', enum: ['PHARMACIST', 'CUSTOMER', 'PHARMACY_OWNER'], example: 'PHARMACIST' },
                    firstName: { type: 'string', example: 'Tadesse' },
                    lastName: { type: 'string', example: 'Mekonnen' },
                    email: { type: 'string', format: 'email', example: 'pharmacist@selampharmacy.com' },
                    phone: { type: 'string', example: '+251922334455' },
                    password: { type: 'string', example: 'Pharma123!' },
                    languagePreference: { type: 'string', enum: ['en', 'am'], default: 'en' },
                },
            },
            CreateLocationRequest: {
                type: 'object',
                required: ['branchId', 'name', 'code', 'locationType'],
                properties: {
                    branchId: { type: 'string', format: 'uuid' },
                    name: { type: 'string', example: 'Front Counter Shelf 2' },
                    code: { type: 'string', example: 'SHELF-02' },
                    locationType: { type: 'string', enum: ['SALES_SHELF', 'WAREHOUSE', 'DISPENSARY', 'QUARANTINE', 'DAMAGED_STORAGE'], example: 'SALES_SHELF' },
                    isSalesPoint: { type: 'boolean', default: false },
                    description: { type: 'string', example: 'Front retail sales display shelf' },
                },
            },
            CreateCategoryRequest: {
                type: 'object',
                required: ['name_en'],
                properties: {
                    name_en: { type: 'string', example: 'Antibiotics' },
                    name_am: { type: 'string', example: 'አንቲባዮቲኮች' },
                    description: { type: 'string', example: 'Antibacterial medications' },
                },
            },
            CreateProductRequest: {
                type: 'object',
                required: ['genericName', 'strength', 'dosageForm', 'sku', 'defaultSellingPrice'],
                properties: {
                    categoryId: { type: 'string', format: 'uuid' },
                    manufacturerId: { type: 'string', format: 'uuid' },
                    genericName: { type: 'string', example: 'Paracetamol' },
                    brandName: { type: 'string', example: 'Panadol Extra' },
                    strength: { type: 'string', example: '500mg' },
                    dosageForm: { type: 'string', example: 'Tablet' },
                    sku: { type: 'string', example: 'MED-PARA-500' },
                    barcode: { type: 'string', example: '8901234567890' },
                    shelfMinQuantity: { type: 'number', default: 10, example: 10 },
                    warehouseMinQuantity: { type: 'number', default: 20, example: 20 },
                    defaultSellingPrice: { type: 'number', example: 100 },
                    prescriptionRequired: { type: 'boolean', default: false },
                    leadTimeDays: { type: 'integer', default: 7 },
                    safetyStockUnits: { type: 'number', default: 20 },
                    medicalInfo: {
                        type: 'object',
                        properties: {
                            indications_en: { type: 'string', example: 'Relief of mild to moderate pain and reduction of fever.' },
                            indications_am: { type: 'string', example: 'መካከለኛ ህመምን ለማስታገስ እና ትኩሳትን ለመቀነስ።' },
                            contraindications_en: { type: 'string', example: 'Severe hepatic impairment.' },
                            contraindications_am: { type: 'string', example: 'ከባድ የጉበት ህመም ላለባቸው አይመከርም።' },
                            dosage_instructions_en: { type: 'string', example: '1-2 tablets every 4-6 hours as needed (max 4g/day).' },
                            dosage_instructions_am: { type: 'string', example: 'እንደ አስፈላጊነቱ በየ 4-6 ሰአቱ 1-2 እንክብል (በቀን ከ 4 ግራም ያልበለጠ)።' },
                            warnings_en: { type: 'string', example: 'Do not exceed the recommended dose.' },
                            warnings_am: { type: 'string', example: 'የታዘዘውን መጠን አያብዙ።' },
                        },
                    },
                },
            },
            UpdateProductPriceRequest: {
                type: 'object',
                required: ['sellingPrice', 'reason'],
                properties: {
                    sellingPrice: { type: 'number', example: 120.0 },
                    reason: { type: 'string', example: 'Manufacturer wholesale price hike' },
                },
            },
            CreateBatchRequest: {
                type: 'object',
                required: ['productId', 'batchNumber', 'expiryDate', 'purchaseCost', 'sellingPrice'],
                properties: {
                    productId: { type: 'string', format: 'uuid' },
                    supplierId: { type: 'string', format: 'uuid' },
                    batchNumber: { type: 'string', example: 'BAT-2026-001' },
                    manufacturingDate: { type: 'string', format: 'date', example: '2026-01-10' },
                    expiryDate: { type: 'string', format: 'date', example: '2027-12-31' },
                    purchaseCost: { type: 'number', example: 80.0 },
                    sellingPrice: { type: 'number', example: 100.0 },
                    notes: { type: 'string', example: 'Initial imported stock' },
                },
            },
            TransferStockRequest: {
                type: 'object',
                required: ['productId', 'batchId', 'sourceLocationId', 'destinationLocationId', 'quantity'],
                properties: {
                    productId: { type: 'string', format: 'uuid' },
                    batchId: { type: 'string', format: 'uuid' },
                    sourceLocationId: { type: 'string', format: 'uuid', description: 'Warehouse Location UUID' },
                    destinationLocationId: { type: 'string', format: 'uuid', description: 'Sales Shelf Location UUID' },
                    quantity: { type: 'number', example: 30 },
                    notes: { type: 'string', example: 'Shelf replenishment from main warehouse' },
                },
            },
            AdjustStockRequest: {
                type: 'object',
                required: ['locationId', 'productId', 'batchId', 'countedQuantity', 'reason'],
                properties: {
                    locationId: { type: 'string', format: 'uuid' },
                    productId: { type: 'string', format: 'uuid' },
                    batchId: { type: 'string', format: 'uuid' },
                    countedQuantity: { type: 'number', example: 45 },
                    reason: { type: 'string', example: 'Monthly physical inventory audit recount' },
                },
            },
            RecordLossRequest: {
                type: 'object',
                required: ['locationId', 'productId', 'batchId', 'quantity', 'lossType', 'notes'],
                properties: {
                    locationId: { type: 'string', format: 'uuid' },
                    productId: { type: 'string', format: 'uuid' },
                    batchId: { type: 'string', format: 'uuid' },
                    quantity: { type: 'number', example: 2 },
                    lossType: { type: 'string', enum: ['DAMAGE', 'EXPIRED'], example: 'DAMAGE' },
                    notes: { type: 'string', example: 'Broken bottle during shelf handling' },
                },
            },
            CreatePurchaseRequest: {
                type: 'object',
                required: ['branchId', 'supplierId', 'destinationLocationId', 'items'],
                properties: {
                    branchId: { type: 'string', format: 'uuid' },
                    supplierId: { type: 'string', format: 'uuid' },
                    destinationLocationId: { type: 'string', format: 'uuid', description: 'Warehouse Location ID' },
                    invoiceNumber: { type: 'string', example: 'SUP-INV-9988' },
                    purchaseDate: { type: 'string', format: 'date', example: '2026-09-29' },
                    status: { type: 'string', enum: ['DRAFT', 'SUBMITTED', 'ORDERED'], default: 'DRAFT' },
                    notes: { type: 'string', example: 'Q3 Wholesale Medicine Restock' },
                    items: {
                        type: 'array',
                        items: {
                            type: 'object',
                            required: ['productId', 'batchNumber', 'expiryDate', 'quantityOrdered', 'unitCost', 'unitSellingPrice'],
                            properties: {
                                productId: { type: 'string', format: 'uuid' },
                                batchNumber: { type: 'string', example: 'B001' },
                                manufacturingDate: { type: 'string', format: 'date', example: '2026-01-01' },
                                expiryDate: { type: 'string', format: 'date', example: '2027-06-30' },
                                quantityOrdered: { type: 'number', example: 100 },
                                unitCost: { type: 'number', example: 80.0 },
                                unitSellingPrice: { type: 'number', example: 100.0 },
                            },
                        },
                    },
                },
            },
            CreateSaleRequest: {
                type: 'object',
                required: ['branchId', 'locationId', 'items'],
                properties: {
                    branchId: { type: 'string', format: 'uuid' },
                    locationId: { type: 'string', format: 'uuid', description: 'Sales Shelf Location ID' },
                    buyerId: { type: 'string', format: 'uuid', description: 'Optional registered user ID who purchased' },
                    discountAmount: { type: 'number', default: 0 },
                    taxAmount: { type: 'number', default: 0 },
                    offlineSyncId: { type: 'string', example: 'OFFLINE_POS_TX_987654321' },
                    notes: { type: 'string', example: 'Walk-in customer sale' },
                    items: {
                        type: 'array',
                        items: {
                            type: 'object',
                            required: ['productId', 'quantity'],
                            properties: {
                                productId: { type: 'string', format: 'uuid' },
                                batchId: { type: 'string', format: 'uuid', description: 'Optional: FEFO will auto-select earliest expiry if omitted' },
                                quantity: { type: 'number', example: 10 },
                                unitPrice: { type: 'number', example: 100 },
                                discount: { type: 'number', default: 0 },
                            },
                        },
                    },
                },
            },
            CreateExpenseRequest: {
                type: 'object',
                required: ['branchId', 'expenseCategory', 'description', 'amount'],
                properties: {
                    branchId: { type: 'string', format: 'uuid' },
                    expenseCategory: { type: 'string', example: 'Utilities' },
                    description: { type: 'string', example: 'Pharmacy electricity bill for September' },
                    amount: { type: 'number', example: 1500.0 },
                    expenseDate: { type: 'string', format: 'date', example: '2026-09-29' },
                },
            },
            VoidExpenseRequest: {
                type: 'object',
                required: ['reason'],
                properties: {
                    reason: { type: 'string', example: 'Duplicate billing entry correction' },
                },
            },
        },
    },
    security: [
        {
            BearerAuth: [],
        },
    ],
    paths: {
        // 0. Platform Admin & Multi-Tenant White-Labeling (Runtime Branding, CMS & Feature Flags)
        '/platform/config/public': {
            get: {
                tags: ['Platform & Tenant Bootstrap (Public Runtime)'],
                summary: 'Bootstrap active tenant configuration (branding, colors, logos, CMS content, feature flags)',
                description: 'Called by React and Flutter apps at startup to render dynamic white-labeled theme, pharmacy name, logos, and custom translations without modifying source code.',
                security: [],
                parameters: [
                    { name: 'tenantCode', in: 'query', schema: { type: 'string' }, description: 'Pharmacy tenant unique code (e.g. BUTU-01, SELAM-01)' },
                    { name: 'x-organization-code', in: 'header', schema: { type: 'string' } },
                ],
                responses: { 200: { description: 'Dynamic tenant configuration' } },
            },
        },
        '/platform/pharmacies': {
            get: {
                tags: ['Platform Admin (Product Management)'],
                summary: 'List all pharmacy installations/tenants with their active branding summary (PLATFORM_ADMIN only)',
                responses: { 200: { description: 'Pharmacy tenants list' } },
            },
            post: {
                tags: ['Platform Admin (Product Management)'],
                summary: 'Onboard and provision a new pharmacy tenant (PLATFORM_ADMIN only)',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['name', 'code'],
                                properties: {
                                    name: { type: 'string', example: 'Habesha Care Pharmacy' },
                                    code: { type: 'string', example: 'HABESHA-01' },
                                    phone: { type: 'string', example: '+251118889900' },
                                    email: { type: 'string', example: 'info@habeshapharmacy.com' },
                                    address: { type: 'string', example: 'Piazza, Addis Ababa' },
                                    branding: {
                                        type: 'object',
                                        properties: {
                                            primaryColor: { type: 'string', example: '#7C3AED' },
                                            secondaryColor: { type: 'string', example: '#6D28D9' },
                                            welcomeMessage: { type: 'string', example: 'Welcome to Habesha Care Pharmacy' },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                responses: { 201: { description: 'Pharmacy onboarded successfully' } },
            },
        },
        '/platform/pharmacies/{id}/configuration': {
            get: {
                tags: ['Platform Admin (Product Management)'],
                summary: 'Get complete white-label configuration for a specific pharmacy tenant (PLATFORM_ADMIN only)',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
                responses: { 200: { description: 'Tenant complete configuration' } },
            },
        },
        '/platform/pharmacies/{id}/branding': {
            patch: {
                tags: ['Platform Admin (Product Management)'],
                summary: 'Update pharmacy branding (colors, logos, names, welcome message, footer) without modifying code',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    displayName: { type: 'string', example: 'Butu Family Pharmacy' },
                                    primaryColor: { type: 'string', example: '#1E3A8A' },
                                    secondaryColor: { type: 'string', example: '#1E40AF' },
                                    accentColor: { type: 'string', example: '#F59E0B' },
                                    logoUrl: { type: 'string', example: 'https://assets.pharmaplatform.com/butu/logo.png' },
                                    welcomeMessage: { type: 'string', example: 'Welcome to Butu Family Pharmacy' },
                                    footerText: { type: 'string', example: '© 2026 Butu Family Pharmacy. All rights reserved.' },
                                },
                            },
                        },
                    },
                },
                responses: { 200: { description: 'Branding updated' } },
            },
        },
        '/platform/pharmacies/{id}/content': {
            patch: {
                tags: ['Platform Admin (Product Management)'],
                summary: 'Update structured bilingual CMS content keys (English & Amharic translations)',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['content'],
                                properties: {
                                    content: {
                                        type: 'object',
                                        example: {
                                            'home.welcome_message': { en: 'Welcome to Butu Modern Dispensary', am: 'ወደ ቡቱ ዘመናዊ መድሃኒት ቤት እንኳን በደህና መጡ' },
                                            'catalog.title': { en: 'Verified Quality Pharmaceuticals', am: 'ጥራታቸው የተረጋገጠ የመድሃኒት ዝርዝር' },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                responses: { 200: { description: 'Content updated' } },
            },
        },
        '/platform/pharmacies/{id}/settings': {
            patch: {
                tags: ['Platform Admin (Product Management)'],
                summary: 'Update application settings (default currency, timezone, tax rate, languages)',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
                responses: { 200: { description: 'Settings updated' } },
            },
        },
        '/platform/pharmacies/{id}/features': {
            patch: {
                tags: ['Platform Admin (Product Management)'],
                summary: 'Configure modular feature flags per pharmacy (public_catalog, barcode_lookup, offline_sync, etc.)',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    public_catalog: { type: 'boolean' },
                                    barcode_lookup: { type: 'boolean' },
                                    customer_purchase_history: { type: 'boolean' },
                                    offline_sync: { type: 'boolean' },
                                },
                            },
                        },
                    },
                },
                responses: { 200: { description: 'Feature toggles updated' } },
            },
        },
        '/platform/pharmacies/{id}/preview': {
            post: {
                tags: ['Platform Admin (Product Management)'],
                summary: 'Preview live configuration changes before saving',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
                responses: { 200: { description: 'Preview payload' } },
            },
        },
        // 1. Auth
        '/auth/register': {
            post: {
                tags: ['Auth'],
                summary: 'Register a new pharmacy organization and owner account',
                security: [],
                requestBody: {
                    required: true,
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterRequest' } } },
                },
                responses: { 201: { description: 'Registered successfully', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } } },
            },
        },
        '/auth/login': {
            post: {
                tags: ['Auth'],
                summary: 'Authenticate user with email and password',
                security: [],
                requestBody: {
                    required: true,
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } },
                },
                responses: { 200: { description: 'Login successful' } },
            },
        },
        '/auth/profile': {
            get: {
                tags: ['Auth'],
                summary: 'Get current authenticated user profile & permissions',
                responses: { 200: { description: 'User profile retrieved' } },
            },
        },
        '/auth/change-password': {
            post: {
                tags: ['Auth'],
                summary: 'Change password for authenticated user',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['currentPassword', 'newPassword'],
                                properties: {
                                    currentPassword: { type: 'string' },
                                    newPassword: { type: 'string' },
                                },
                            },
                        },
                    },
                },
                responses: { 200: { description: 'Password changed successfully' } },
            },
        },
        '/auth/language': {
            post: {
                tags: ['Auth'],
                summary: 'Update user language preference (en or am)',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['language'],
                                properties: { language: { type: 'string', enum: ['en', 'am'] } },
                            },
                        },
                    },
                },
                responses: { 200: { description: 'Language updated' } },
            },
        },
        // 2. Users / Staff Management
        '/users': {
            get: {
                tags: ['Users (Owner Management)'],
                summary: 'List pharmacy employees (Pharmacists, Staff)',
                parameters: [{ name: 'branchId', in: 'query', schema: { type: 'string', format: 'uuid' } }],
                responses: { 200: { description: 'Users list' } },
            },
            post: {
                tags: ['Users (Owner Management)'],
                summary: 'Create employee account',
                requestBody: {
                    required: true,
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateUserRequest' } } },
                },
                responses: { 201: { description: 'User created' } },
            },
        },
        '/users/{id}': {
            get: {
                tags: ['Users (Owner Management)'],
                summary: 'Get user details by ID',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
                responses: { 200: { description: 'User details' } },
            },
            put: {
                tags: ['Users (Owner Management)'],
                summary: 'Update user profile and details',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    firstName: { type: 'string' },
                                    lastName: { type: 'string' },
                                    phone: { type: 'string' },
                                    isActive: { type: 'boolean' },
                                },
                            },
                        },
                    },
                },
                responses: { 200: { description: 'User updated' } },
            },
            patch: {
                tags: ['Users (Owner Management)'],
                summary: 'Partially update user profile and details',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    firstName: { type: 'string' },
                                    lastName: { type: 'string' },
                                    phone: { type: 'string' },
                                    isActive: { type: 'boolean' },
                                    languagePreference: { type: 'string', enum: ['en', 'am'] },
                                },
                            },
                        },
                    },
                },
                responses: { 200: { description: 'User partially updated' } },
            },
        },
        '/users/{id}/status': {
            patch: {
                tags: ['Users (Owner Management)'],
                summary: 'Activate or Deactivate employee account (Pharmacist / Staff)',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['isActive'],
                                properties: {
                                    isActive: { type: 'boolean', example: false, description: 'Set true to activate, false to deactivate' },
                                },
                            },
                        },
                    },
                },
                responses: { 200: { description: 'User active status updated' } },
            },
        },
        // 3. Organization & Branches
        '/organizations': {
            get: {
                tags: ['Organizations'],
                summary: 'Get organization details',
                responses: { 200: { description: 'Organization info' } },
            },
            put: {
                tags: ['Organizations'],
                summary: 'Update organization settings',
                requestBody: {
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: { name: { type: 'string' }, phone: { type: 'string' }, email: { type: 'string' }, address: { type: 'string' } },
                            },
                        },
                    },
                },
                responses: { 200: { description: 'Organization updated' } },
            },
        },
        '/organizations/branches': {
            get: {
                tags: ['Organizations'],
                summary: 'List pharmacy branches',
                responses: { 200: { description: 'Branches list' } },
            },
            post: {
                tags: ['Organizations'],
                summary: 'Create a new pharmacy branch (automatically provisions Sales Shelf and Warehouse)',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['name', 'code'],
                                properties: { name: { type: 'string' }, code: { type: 'string' }, phone: { type: 'string' }, city: { type: 'string' } },
                            },
                        },
                    },
                },
                responses: { 201: { description: 'Branch created' } },
            },
        },
        // 4. Locations (Shelf vs Warehouse)
        '/locations': {
            get: {
                tags: ['Locations'],
                summary: 'List physical stock locations (Sales Shelves, Warehouses, Quarantine)',
                parameters: [
                    { name: 'branchId', in: 'query', schema: { type: 'string', format: 'uuid' } },
                    { name: 'locationType', in: 'query', schema: { type: 'string', enum: ['SALES_SHELF', 'WAREHOUSE', 'DISPENSARY', 'QUARANTINE', 'DAMAGED_STORAGE'] } },
                ],
                responses: { 200: { description: 'Locations list' } },
            },
            post: {
                tags: ['Locations'],
                summary: 'Create a new physical storage location',
                requestBody: {
                    required: true,
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateLocationRequest' } } },
                },
                responses: { 201: { description: 'Location created' } },
            },
        },
        // 5. Categories
        '/categories': {
            get: {
                tags: ['Categories'],
                summary: 'List medicine categories (bilingual EN/AM) (Public Access)',
                responses: { 200: { description: 'Categories list' } },
            },
            post: {
                tags: ['Categories'],
                summary: 'Create category',
                requestBody: {
                    required: true,
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateCategoryRequest' } } },
                },
                responses: { 201: { description: 'Category created' } },
            },
        },
        // 6. Manufacturers & Suppliers
        '/manufacturers': {
            get: { tags: ['Manufacturers'], summary: 'List manufacturers (Public Access)', responses: { 200: { description: 'List' } } },
            post: {
                tags: ['Manufacturers'],
                summary: 'Create manufacturer',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['name'],
                                properties: { name: { type: 'string' }, country: { type: 'string' }, contact_email: { type: 'string' } },
                            },
                        },
                    },
                },
                responses: { 201: { description: 'Created' } },
            },
        },
        '/suppliers': {
            get: { tags: ['Suppliers'], summary: 'List suppliers', responses: { 200: { description: 'List' } } },
            post: {
                tags: ['Suppliers'],
                summary: 'Create supplier',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['name'],
                                properties: { name: { type: 'string' }, contact_person: { type: 'string' }, phone: { type: 'string' }, lead_time_days: { type: 'integer', default: 7 } },
                            },
                        },
                    },
                },
                responses: { 201: { description: 'Created' } },
            },
        },
        // 7. Products & Medicines
        '/products': {
            get: {
                tags: ['Products (Medicines)'],
                summary: 'Search and list medicines with real-time location stock status breakdown (Public Access)',
                parameters: [
                    { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Search generic name, brand name, SKU, or barcode' },
                    { name: 'categoryId', in: 'query', schema: { type: 'string', format: 'uuid' } },
                    { name: 'prescriptionRequired', in: 'query', schema: { type: 'boolean' } },
                    { name: 'isActive', in: 'query', schema: { type: 'boolean' } },
                ],
                responses: { 200: { description: 'Medicines catalog with stock status' } },
            },
            post: {
                tags: ['Products (Medicines)'],
                summary: 'Create medicine master record with bilingual medical information',
                requestBody: {
                    required: true,
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateProductRequest' } } },
                },
                responses: { 201: { description: 'Medicine created' } },
            },
        },
        '/products/barcode/{barcode}': {
            get: {
                tags: ['Products (Medicines)'],
                summary: 'Instant barcode / SKU scanner lookup (Public Access)',
                parameters: [{ name: 'barcode', in: 'path', required: true, schema: { type: 'string' } }],
                responses: { 200: { description: 'Medicine found' } },
            },
        },
        '/products/{id}': {
            get: {
                tags: ['Products (Medicines)'],
                summary: 'Get full medicine details including stock by batch and location and bilingual medical info (Public Access)',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
                responses: { 200: { description: 'Medicine details' } },
            },
            patch: {
                tags: ['Products (Medicines)'],
                summary: 'Update medicine details (partial update)',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
                requestBody: {
                    content: { 'application/json': { schema: { type: 'object' } } },
                },
                responses: { 200: { description: 'Medicine updated' } },
            },
        },
        '/products/{id}/status': {
            patch: {
                tags: ['Products (Medicines)'],
                summary: 'Activate or deactivate medicine (soft delete replacement)',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
                requestBody: {
                    required: true,
                    content: { 'application/json': { schema: { type: 'object', required: ['isActive'], properties: { isActive: { type: 'boolean' } } } } },
                },
                responses: { 200: { description: 'Status updated' } },
            },
        },
        '/products/{id}/price': {
            patch: {
                tags: ['Products (Medicines)'],
                summary: 'Update default selling price and append to audited price history (Owner only)',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
                requestBody: {
                    required: true,
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateProductPriceRequest' } } },
                },
                responses: { 200: { description: 'Price updated and history logged' } },
            },
        },
        '/products/{id}/price-history': {
            get: {
                tags: ['Products (Medicines)'],
                summary: 'Get historical price change audit log for medicine',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
                responses: { 200: { description: 'Price change history' } },
            },
        },
        '/products/{id}/availability': {
            get: {
                tags: ['Products (Medicines)'],
                summary: 'Check Real-Time Stock Availability per Branch & Sales Shelf (Public Access)',
                description: 'Returns real-time stock availability, whether medicine is available on front shelf for immediate purchase, and per-branch stock breakdown.',
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
                    { name: 'branchId', in: 'query', schema: { type: 'string', format: 'uuid' } },
                ],
                responses: { 200: { description: 'Real-time stock availability' } },
            },
        },
        // 8. Batches
        '/batches': {
            get: {
                tags: ['Batches'],
                summary: 'List medicine batches in FEFO order with expiry tracking',
                parameters: [
                    { name: 'productId', in: 'query', schema: { type: 'string', format: 'uuid' } },
                    { name: 'isQuarantined', in: 'query', schema: { type: 'boolean' } },
                ],
                responses: { 200: { description: 'Batches list' } },
            },
            post: {
                tags: ['Batches'],
                summary: 'Create a medicine batch record',
                requestBody: {
                    required: true,
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateBatchRequest' } } },
                },
                responses: { 201: { description: 'Batch created' } },
            },
        },
        '/batches/{id}/quarantine': {
            patch: {
                tags: ['Batches'],
                summary: 'Toggle batch quarantine status (quarantined batches cannot be sold)',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['isQuarantined'],
                                properties: { isQuarantined: { type: 'boolean' }, notes: { type: 'string' } },
                            },
                        },
                    },
                },
                responses: { 200: { description: 'Quarantine status updated' } },
            },
        },
        // 9. Inventory & Stock Operations (Staff Only)
        '/inventory/overview': {
            get: {
                tags: ['Inventory Management (Staff Only)'],
                summary: 'Multi-location stock breakdown: Sales Shelf vs Warehouse vs Total Available with smart status (Staff Only)',
                parameters: [{ name: 'branchId', in: 'query', schema: { type: 'string', format: 'uuid' } }],
                responses: { 200: { description: 'Location-aware stock summary' } },
            },
        },
        '/inventory/location/{locationId}': {
            get: {
                tags: ['Inventory Management (Staff Only)'],
                summary: 'List all batches and quantities at a specific physical location',
                parameters: [{ name: 'locationId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
                responses: { 200: { description: 'Stock at location' } },
            },
        },
        '/inventory/transfer': {
            post: {
                tags: ['Inventory Management (Staff Only)'],
                summary: 'Transfer stock between locations (e.g. Warehouse → Sales Shelf, Branch → Branch)',
                description: 'Transfers do NOT affect total available stock or revenue. Records atomic TRANSFER transaction.',
                requestBody: {
                    required: true,
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/TransferStockRequest' } } },
                },
                responses: { 200: { description: 'Stock transferred successfully' } },
            },
        },
        '/inventory/adjust': {
            post: {
                tags: ['Inventory Management (Staff Only)'],
                summary: 'Adjust physical stock count after audit/verification',
                requestBody: {
                    required: true,
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/AdjustStockRequest' } } },
                },
                responses: { 200: { description: 'Adjustment recorded' } },
            },
        },
        '/inventory/loss': {
            post: {
                tags: ['Inventory Management (Staff Only)'],
                summary: 'Record damaged or expired inventory loss write-off (never counted as sales)',
                requestBody: {
                    required: true,
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/RecordLossRequest' } } },
                },
                responses: { 200: { description: 'Loss write-off recorded' } },
            },
        },
        '/inventory/transactions': {
            get: {
                tags: ['Inventory Management (Staff Only)'],
                summary: 'Full audit trail of all stock movements (RECEIVE, SALE, TRANSFER, DAMAGE, EXPIRED, STOCK_COUNT_ADJUSTMENT)',
                parameters: [
                    { name: 'transactionType', in: 'query', schema: { type: 'string', enum: ['RECEIVE', 'TRANSFER', 'SALE', 'DAMAGE', 'EXPIRED', 'STOCK_COUNT_ADJUSTMENT'] } },
                    { name: 'productId', in: 'query', schema: { type: 'string', format: 'uuid' } },
                ],
                responses: { 200: { description: 'Transaction history' } },
            },
        },
        // 10. Procurement & Purchases Lifecycle
        '/purchases': {
            get: {
                tags: ['Purchases & Procurement Lifecycle'],
                summary: 'List purchase orders with status filter',
                parameters: [
                    { name: 'branchId', in: 'query', schema: { type: 'string', format: 'uuid' } },
                    { name: 'status', in: 'query', schema: { type: 'string', enum: ['DRAFT', 'SUBMITTED', 'APPROVED', 'ORDERED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED'] } },
                ],
                responses: { 200: { description: 'Purchases list' } },
            },
            post: {
                tags: ['Purchases & Procurement Lifecycle'],
                summary: 'Create purchase order (initial status DRAFT or SUBMITTED)',
                requestBody: {
                    required: true,
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/CreatePurchaseRequest' } } },
                },
                responses: { 201: { description: 'Purchase order created' } },
            },
        },
        '/purchases/{id}': {
            get: {
                tags: ['Purchases & Procurement Lifecycle'],
                summary: 'Get purchase order details and items',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
                responses: { 200: { description: 'Purchase details' } },
            },
        },
        '/purchases/{id}/submit': {
            patch: {
                tags: ['Purchases & Procurement Lifecycle'],
                summary: 'Submit DRAFT purchase order for Owner approval',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
                responses: { 200: { description: 'Purchase order submitted' } },
            },
        },
        '/purchases/{id}/approve': {
            patch: {
                tags: ['Purchases & Procurement Lifecycle'],
                summary: 'Approve SUBMITTED purchase order (Pharmacy Owner only)',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
                responses: { 200: { description: 'Purchase order approved' } },
            },
        },
        '/purchases/{id}/order': {
            patch: {
                tags: ['Purchases & Procurement Lifecycle'],
                summary: 'Mark approved purchase as ordered with supplier',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
                responses: { 200: { description: 'Purchase order marked as ordered' } },
            },
        },
        '/purchases/{id}/receive': {
            post: {
                tags: ['Purchases & Procurement Lifecycle'],
                summary: 'Receive purchase order goods into Warehouse reserve inventory (creates batches and RECEIVE transactions)',
                description: 'Automatically creates/updates product batches in product_batches, increments destination Warehouse stock, and updates status to PARTIALLY_RECEIVED or RECEIVED.',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
                responses: { 200: { description: 'Goods received and batches populated' } },
            },
        },
        '/purchases/{id}/cancel': {
            patch: {
                tags: ['Purchases & Procurement Lifecycle'],
                summary: 'Cancel purchase order before completion',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
                requestBody: {
                    required: true,
                    content: { 'application/json': { schema: { type: 'object', required: ['reason'], properties: { reason: { type: 'string' } } } } },
                },
                responses: { 200: { description: 'Purchase order cancelled' } },
            },
        },
        // 11. POS & Sales & Customer Purchases
        '/sales/my-purchases': {
            get: {
                tags: ['Sales & Purchases History (Customer Only)'],
                summary: 'List medicines purchased by the currently logged-in customer',
                description: 'Returns all sales invoices and medicine purchase receipts associated with the authenticated customer account (Restricted to CUSTOMER role). Staff access sales via /sales.',
                responses: { 200: { description: 'Customer purchase history list' } },
            },
        },
        '/sales/my-purchases/{id}': {
            get: {
                tags: ['Sales & Purchases History (Customer Only)'],
                summary: 'Get details of a specific medicine purchase receipt by ID for the logged-in customer',
                description: 'Returns patient-safe receipt breakdown (medicine name, quantity, price) without disclosing internal batch costs or margins.',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
                responses: { 200: { description: 'Purchase receipt and item details' } },
            },
        },
        '/sales': {
            get: {
                tags: ['Sales & POS (Operations)'],
                summary: 'List sales invoices with profit and COGS snapshots',
                parameters: [
                    { name: 'startDate', in: 'query', schema: { type: 'string' } },
                    { name: 'endDate', in: 'query', schema: { type: 'string' } },
                    { name: 'buyerId', in: 'query', schema: { type: 'string', format: 'uuid' } },
                ],
                responses: { 200: { description: 'Sales list' } },
            },
        },
        '/sales/checkout': {
            post: {
                tags: ['Sales & POS (Operations)'],
                summary: 'Process POS checkout sale (atomic FEFO deduction, historical price snapshot, offline sync idempotency)',
                requestBody: {
                    required: true,
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateSaleRequest' } } },
                },
                responses: { 201: { description: 'Sale completed successfully' } },
            },
        },
        '/sales/{id}': {
            get: {
                tags: ['Sales & POS (Operations)'],
                summary: 'Get sale invoice detail receipt with itemized historical unit prices and batch costs',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
                responses: { 200: { description: 'Sale receipt' } },
            },
        },
        // 12. Expenses
        '/expenses': {
            get: {
                tags: ['Expenses'],
                summary: 'List pharmacy operating expenses',
                parameters: [
                    { name: 'branchId', in: 'query', schema: { type: 'string', format: 'uuid' } },
                    { name: 'startDate', in: 'query', schema: { type: 'string' } },
                    { name: 'endDate', in: 'query', schema: { type: 'string' } },
                    { name: 'isVoided', in: 'query', schema: { type: 'boolean' } },
                ],
                responses: { 200: { description: 'Expenses list' } },
            },
            post: {
                tags: ['Expenses'],
                summary: 'Record an expense',
                requestBody: {
                    required: true,
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateExpenseRequest' } } },
                },
                responses: { 201: { description: 'Expense recorded' } },
            },
        },
        '/expenses/{id}': {
            get: {
                tags: ['Expenses'],
                summary: 'Get single expense details',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
                responses: { 200: { description: 'Expense details' } },
            },
            patch: {
                tags: ['Expenses'],
                summary: 'Update expense record (Pharmacy Owner only)',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
                requestBody: {
                    content: { 'application/json': { schema: { type: 'object' } } },
                },
                responses: { 200: { description: 'Expense updated' } },
            },
        },
        '/expenses/{id}/void': {
            patch: {
                tags: ['Expenses'],
                summary: 'Void an expense with audited reason (Pharmacy Owner only)',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
                requestBody: {
                    required: true,
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/VoidExpenseRequest' } } },
                },
                responses: { 200: { description: 'Expense voided' } },
            },
        },
        // 13. Smart Notifications
        '/notifications': {
            get: {
                tags: ['Smart Notifications'],
                summary: 'Get context-aware alerts (Shelf Low, Shelf Empty Refill, Warehouse Low, Out of Stock, Expiry)',
                parameters: [
                    { name: 'isRead', in: 'query', schema: { type: 'boolean' } },
                    { name: 'isResolved', in: 'query', schema: { type: 'boolean' } },
                    { name: 'branchId', in: 'query', schema: { type: 'string', format: 'uuid' } },
                ],
                responses: { 200: { description: 'Notifications list' } },
            },
        },
        '/notifications/mark-all-read': {
            patch: {
                tags: ['Smart Notifications'],
                summary: 'Mark all notifications as read',
                responses: { 200: { description: 'All notifications marked as read' } },
            },
        },
        '/notifications/{id}/read': {
            patch: {
                tags: ['Smart Notifications'],
                summary: 'Mark single notification as read',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
                responses: { 200: { description: 'Marked read' } },
            },
        },
        '/notifications/{id}/resolve': {
            patch: {
                tags: ['Smart Notifications'],
                summary: 'Mark notification as resolved (action taken)',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
                responses: { 200: { description: 'Marked resolved' } },
            },
        },
        '/notifications/check-expiry': {
            post: {
                tags: ['Smart Notifications'],
                summary: 'Trigger on-demand batch expiry evaluation scan',
                responses: { 200: { description: 'Expiry check executed' } },
            },
        },
        // 14. Analytics & Intelligence Reports
        '/analytics/dashboard': {
            get: {
                tags: ['Analytics & Business Intelligence'],
                summary: 'Owner dashboard metrics (Revenue, COGS, Gross Profit, Expenses, Net Profit, Stock Value, Health)',
                parameters: [
                    { name: 'period', in: 'query', schema: { type: 'string', enum: ['today', '7days', '30days', '1year', 'custom'], default: 'today' } },
                    { name: 'startDate', in: 'query', schema: { type: 'string' } },
                    { name: 'endDate', in: 'query', schema: { type: 'string' } },
                    { name: 'branchId', in: 'query', schema: { type: 'string', format: 'uuid' } },
                ],
                responses: { 200: { description: 'Dashboard financial & inventory KPIs' } },
            },
        },
        '/analytics/top-selling': {
            get: {
                tags: ['Analytics & Business Intelligence'],
                summary: 'Top-selling medicines by revenue, units sold, and profit margin with branch and custom date filters',
                parameters: [
                    { name: 'period', in: 'query', schema: { type: 'string', default: '30days' } },
                    { name: 'startDate', in: 'query', schema: { type: 'string' } },
                    { name: 'endDate', in: 'query', schema: { type: 'string' } },
                    { name: 'branchId', in: 'query', schema: { type: 'string', format: 'uuid' } },
                    { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
                ],
                responses: { 200: { description: 'Top selling medicines' } },
            },
        },
        '/analytics/categories': {
            get: {
                tags: ['Analytics & Business Intelligence'],
                summary: 'Sales & profit distribution by medicine category with branch and custom date filters',
                parameters: [
                    { name: 'period', in: 'query', schema: { type: 'string', default: '30days' } },
                    { name: 'startDate', in: 'query', schema: { type: 'string' } },
                    { name: 'endDate', in: 'query', schema: { type: 'string' } },
                    { name: 'branchId', in: 'query', schema: { type: 'string', format: 'uuid' } },
                ],
                responses: { 200: { description: 'Category breakdown' } },
            },
        },
        '/analytics/demand-restock': {
            get: {
                tags: ['Analytics & Business Intelligence'],
                summary: 'Demand forecasting (Average Daily Sales, Lead Time Demand, Safety Stock, Suggested Reorder Qty)',
                parameters: [{ name: 'branchId', in: 'query', schema: { type: 'string', format: 'uuid' } }],
                responses: { 200: { description: 'Reorder recommendations' } },
            },
        },
        // 15. Audit Logs
        '/audit-logs': {
            get: {
                tags: ['Audit Logs'],
                summary: 'Query immutable security and operational audit trail',
                parameters: [
                    { name: 'action', in: 'query', schema: { type: 'string' } },
                    { name: 'entityName', in: 'query', schema: { type: 'string' } },
                    { name: 'userId', in: 'query', schema: { type: 'string', format: 'uuid' } },
                ],
                responses: { 200: { description: 'Audit trail events' } },
            },
        },
    },
};
//# sourceMappingURL=openapi.js.map