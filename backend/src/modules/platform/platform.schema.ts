import { z } from 'zod';

const hexColorSchema = z
  .string()
  .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Color must be a valid hex string (e.g., #0D9488 or #0F7)')
  .optional();

export const createPharmacySchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Pharmacy name is required'),
    code: z.string().min(2, 'Unique pharmacy code is required').regex(/^[A-Z0-9_-]+$/i, 'Code must be alphanumeric'),
    taxId: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email('Valid email is required').optional(),
    address: z.string().optional(),
    currency: z.string().default('ETB'),
    mainBranchName: z.string().default('Main Branch'),
    mainBranchCode: z.string().default('MAIN'),
    branding: z.object({
      primaryColor: hexColorSchema,
      secondaryColor: hexColorSchema,
      accentColor: hexColorSchema,
      logoUrl: z.string().url('Must be a valid URL').optional().nullable(),
      faviconUrl: z.string().url('Must be a valid URL').optional().nullable(),
      welcomeMessage: z.string().optional(),
      footerText: z.string().optional(),
    }).optional(),
  }),
});

export const updateBrandingSchema = z.object({
  body: z.object({
    pharmacyName: z.string().min(2).optional(),
    displayName: z.string().min(2).optional(),
    logoUrl: z.string().url().optional().nullable(),
    faviconUrl: z.string().url().optional().nullable(),
    primaryColor: hexColorSchema,
    secondaryColor: hexColorSchema,
    accentColor: hexColorSchema,
    backgroundColor: hexColorSchema,
    textColor: hexColorSchema,
    loginPageBranding: z.object({
      title: z.string().optional(),
      subtitle: z.string().optional(),
      bannerUrl: z.string().url().optional().nullable(),
    }).optional(),
    dashboardBranding: z.object({
      headerTitle: z.string().optional(),
      supportContact: z.string().optional(),
    }).optional(),
    footerText: z.string().optional(),
    description: z.string().optional(),
    contactEmail: z.string().email().optional().nullable(),
    contactPhone: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    website: z.string().url().optional().nullable(),
    welcomeMessage: z.string().optional(),
  }),
});

export const updateContentSchema = z.object({
  body: z.object({
    content: z.record(
      z.string().regex(/^[a-zA-Z0-9_.-]+$/, 'Content keys must follow structured format (e.g., home.welcome_message)'),
      z.object({
        en: z.string().min(1, 'English translation is required').refine((val) => !/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi.test(val), {
          message: 'Executable script tags are strictly prohibited',
        }),
        am: z.string().optional().refine((val) => !val || !/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi.test(val), {
          message: 'Executable script tags are strictly prohibited',
        }),
      })
    ),
  }),
});

export const updateSettingsSchema = z.object({
  body: z.object({
    defaultCurrency: z.string().min(2).max(10).optional(),
    supportedLanguages: z.array(z.enum(['en', 'am'])).min(1).optional(),
    defaultLanguage: z.enum(['en', 'am']).optional(),
    timezone: z.string().optional(),
    receiptFooter: z.string().optional(),
    taxRate: z.number().min(0).max(1).optional(),
  }),
});

export const updateFeaturesSchema = z.object({
  body: z.object({
    public_catalog: z.boolean().optional(),
    barcode_lookup: z.boolean().optional(),
    customer_purchase_history: z.boolean().optional(),
    notifications: z.boolean().optional(),
    analytics: z.boolean().optional(),
    inventory_management: z.boolean().optional(),
    purchasing_procurement: z.boolean().optional(),
    offline_sync: z.boolean().optional(),
  }),
});
