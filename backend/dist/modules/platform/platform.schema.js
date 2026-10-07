"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateFeaturesSchema = exports.updateSettingsSchema = exports.updateContentSchema = exports.updateBrandingSchema = exports.createPharmacySchema = void 0;
const zod_1 = require("zod");
const hexColorSchema = zod_1.z
    .string()
    .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Color must be a valid hex string (e.g., #0D9488 or #0F7)')
    .optional();
exports.createPharmacySchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(2, 'Pharmacy name is required'),
        code: zod_1.z.string().min(2, 'Unique pharmacy code is required').regex(/^[A-Z0-9_-]+$/i, 'Code must be alphanumeric'),
        taxId: zod_1.z.string().optional(),
        phone: zod_1.z.string().optional(),
        email: zod_1.z.string().email('Valid email is required').optional(),
        address: zod_1.z.string().optional(),
        currency: zod_1.z.string().default('ETB'),
        mainBranchName: zod_1.z.string().default('Main Branch'),
        mainBranchCode: zod_1.z.string().default('MAIN'),
        branding: zod_1.z.object({
            primaryColor: hexColorSchema,
            secondaryColor: hexColorSchema,
            accentColor: hexColorSchema,
            logoUrl: zod_1.z.string().url('Must be a valid URL').optional().nullable(),
            faviconUrl: zod_1.z.string().url('Must be a valid URL').optional().nullable(),
            welcomeMessage: zod_1.z.string().optional(),
            footerText: zod_1.z.string().optional(),
        }).optional(),
    }),
});
exports.updateBrandingSchema = zod_1.z.object({
    body: zod_1.z.object({
        pharmacyName: zod_1.z.string().min(2).optional(),
        displayName: zod_1.z.string().min(2).optional(),
        logoUrl: zod_1.z.string().url().optional().nullable(),
        faviconUrl: zod_1.z.string().url().optional().nullable(),
        primaryColor: hexColorSchema,
        secondaryColor: hexColorSchema,
        accentColor: hexColorSchema,
        backgroundColor: hexColorSchema,
        textColor: hexColorSchema,
        loginPageBranding: zod_1.z.object({
            title: zod_1.z.string().optional(),
            subtitle: zod_1.z.string().optional(),
            bannerUrl: zod_1.z.string().url().optional().nullable(),
        }).optional(),
        dashboardBranding: zod_1.z.object({
            headerTitle: zod_1.z.string().optional(),
            supportContact: zod_1.z.string().optional(),
        }).optional(),
        footerText: zod_1.z.string().optional(),
        description: zod_1.z.string().optional(),
        contactEmail: zod_1.z.string().email().optional().nullable(),
        contactPhone: zod_1.z.string().optional().nullable(),
        address: zod_1.z.string().optional().nullable(),
        website: zod_1.z.string().url().optional().nullable(),
        welcomeMessage: zod_1.z.string().optional(),
    }),
});
exports.updateContentSchema = zod_1.z.object({
    body: zod_1.z.object({
        content: zod_1.z.record(zod_1.z.string().regex(/^[a-zA-Z0-9_.-]+$/, 'Content keys must follow structured format (e.g., home.welcome_message)'), zod_1.z.object({
            en: zod_1.z.string().min(1, 'English translation is required').refine((val) => !/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi.test(val), {
                message: 'Executable script tags are strictly prohibited',
            }),
            am: zod_1.z.string().optional().refine((val) => !val || !/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi.test(val), {
                message: 'Executable script tags are strictly prohibited',
            }),
        })),
    }),
});
exports.updateSettingsSchema = zod_1.z.object({
    body: zod_1.z.object({
        defaultCurrency: zod_1.z.string().min(2).max(10).optional(),
        supportedLanguages: zod_1.z.array(zod_1.z.enum(['en', 'am'])).min(1).optional(),
        defaultLanguage: zod_1.z.enum(['en', 'am']).optional(),
        timezone: zod_1.z.string().optional(),
        receiptFooter: zod_1.z.string().optional(),
        taxRate: zod_1.z.number().min(0).max(1).optional(),
    }),
});
exports.updateFeaturesSchema = zod_1.z.object({
    body: zod_1.z.object({
        public_catalog: zod_1.z.boolean().optional(),
        barcode_lookup: zod_1.z.boolean().optional(),
        customer_purchase_history: zod_1.z.boolean().optional(),
        notifications: zod_1.z.boolean().optional(),
        analytics: zod_1.z.boolean().optional(),
        inventory_management: zod_1.z.boolean().optional(),
        purchasing_procurement: zod_1.z.boolean().optional(),
        offline_sync: zod_1.z.boolean().optional(),
    }),
});
//# sourceMappingURL=platform.schema.js.map