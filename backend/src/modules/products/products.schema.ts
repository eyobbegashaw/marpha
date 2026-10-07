import { z } from 'zod';

export const createProductSchema = z.object({
  body: z.object({
    categoryId: z.string().uuid().optional(),
    manufacturerId: z.string().uuid().optional(),
    genericName: z.string().min(2, 'Generic name must be in English'),
    brandName: z.string().optional(),
    strength: z.string().min(1, 'Strength is required (e.g. 500mg)'),
    dosageForm: z.string().min(1, 'Dosage form is required (e.g. Tablet, Syrup)'),
    sku: z.string().min(2, 'SKU is required'),
    barcode: z.string().optional(),
    shelfMinQuantity: z.number().nonnegative().default(10),
    warehouseMinQuantity: z.number().nonnegative().default(20),
    defaultSellingPrice: z.number().nonnegative(),
    prescriptionRequired: z.boolean().default(false),
    leadTimeDays: z.number().int().positive().default(7),
    safetyStockUnits: z.number().nonnegative().default(20),
    unitOfMeasure: z.string().default('Unit'),
    medicalInfo: z
      .object({
        indications_en: z.string().optional(),
        indications_am: z.string().optional(),
        contraindications_en: z.string().optional(),
        contraindications_am: z.string().optional(),
        side_effects_en: z.string().optional(),
        side_effects_am: z.string().optional(),
        dosage_instructions_en: z.string().optional(),
        dosage_instructions_am: z.string().optional(),
        storage_info_en: z.string().optional(),
        storage_info_am: z.string().optional(),
        warnings_en: z.string().optional(),
        warnings_am: z.string().optional(),
      })
      .optional(),
  }),
});

export const updateProductSchema = z.object({
  body: z.object({
    categoryId: z.string().uuid().optional(),
    manufacturerId: z.string().uuid().optional(),
    genericName: z.string().min(2).optional(),
    brandName: z.string().optional(),
    strength: z.string().optional(),
    dosageForm: z.string().optional(),
    barcode: z.string().optional(),
    shelfMinQuantity: z.number().nonnegative().optional(),
    warehouseMinQuantity: z.number().nonnegative().optional(),
    defaultSellingPrice: z.number().nonnegative().optional(),
    prescriptionRequired: z.boolean().optional(),
    leadTimeDays: z.number().int().positive().optional(),
    safetyStockUnits: z.number().nonnegative().optional(),
    unitOfMeasure: z.string().optional(),
    isActive: z.boolean().optional(),
    medicalInfo: z
      .object({
        indications_en: z.string().optional(),
        indications_am: z.string().optional(),
        contraindications_en: z.string().optional(),
        contraindications_am: z.string().optional(),
        side_effects_en: z.string().optional(),
        side_effects_am: z.string().optional(),
        dosage_instructions_en: z.string().optional(),
        dosage_instructions_am: z.string().optional(),
        storage_info_en: z.string().optional(),
        storage_info_am: z.string().optional(),
        warnings_en: z.string().optional(),
        warnings_am: z.string().optional(),
      })
      .optional(),
  }),
});

export const updateProductPriceSchema = z.object({
  body: z.object({
    sellingPrice: z.number().positive('Selling price must be greater than 0'),
    reason: z.string().min(2, 'Reason for price update is required'),
  }),
});

export const updateProductStatusSchema = z.object({
  body: z.object({
    isActive: z.boolean(),
  }),
});
