"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProductStatusSchema = exports.updateProductPriceSchema = exports.updateProductSchema = exports.createProductSchema = void 0;
const zod_1 = require("zod");
exports.createProductSchema = zod_1.z.object({
    body: zod_1.z.object({
        categoryId: zod_1.z.string().uuid().optional(),
        manufacturerId: zod_1.z.string().uuid().optional(),
        genericName: zod_1.z.string().min(2, 'Generic name must be in English'),
        brandName: zod_1.z.string().optional(),
        strength: zod_1.z.string().min(1, 'Strength is required (e.g. 500mg)'),
        dosageForm: zod_1.z.string().min(1, 'Dosage form is required (e.g. Tablet, Syrup)'),
        sku: zod_1.z.string().min(2, 'SKU is required'),
        barcode: zod_1.z.string().optional(),
        shelfMinQuantity: zod_1.z.number().nonnegative().default(10),
        warehouseMinQuantity: zod_1.z.number().nonnegative().default(20),
        defaultSellingPrice: zod_1.z.number().nonnegative(),
        prescriptionRequired: zod_1.z.boolean().default(false),
        leadTimeDays: zod_1.z.number().int().positive().default(7),
        safetyStockUnits: zod_1.z.number().nonnegative().default(20),
        unitOfMeasure: zod_1.z.string().default('Unit'),
        medicalInfo: zod_1.z
            .object({
            indications_en: zod_1.z.string().optional(),
            indications_am: zod_1.z.string().optional(),
            contraindications_en: zod_1.z.string().optional(),
            contraindications_am: zod_1.z.string().optional(),
            side_effects_en: zod_1.z.string().optional(),
            side_effects_am: zod_1.z.string().optional(),
            dosage_instructions_en: zod_1.z.string().optional(),
            dosage_instructions_am: zod_1.z.string().optional(),
            storage_info_en: zod_1.z.string().optional(),
            storage_info_am: zod_1.z.string().optional(),
            warnings_en: zod_1.z.string().optional(),
            warnings_am: zod_1.z.string().optional(),
        })
            .optional(),
    }),
});
exports.updateProductSchema = zod_1.z.object({
    body: zod_1.z.object({
        categoryId: zod_1.z.string().uuid().optional(),
        manufacturerId: zod_1.z.string().uuid().optional(),
        genericName: zod_1.z.string().min(2).optional(),
        brandName: zod_1.z.string().optional(),
        strength: zod_1.z.string().optional(),
        dosageForm: zod_1.z.string().optional(),
        barcode: zod_1.z.string().optional(),
        shelfMinQuantity: zod_1.z.number().nonnegative().optional(),
        warehouseMinQuantity: zod_1.z.number().nonnegative().optional(),
        defaultSellingPrice: zod_1.z.number().nonnegative().optional(),
        prescriptionRequired: zod_1.z.boolean().optional(),
        leadTimeDays: zod_1.z.number().int().positive().optional(),
        safetyStockUnits: zod_1.z.number().nonnegative().optional(),
        unitOfMeasure: zod_1.z.string().optional(),
        isActive: zod_1.z.boolean().optional(),
        medicalInfo: zod_1.z
            .object({
            indications_en: zod_1.z.string().optional(),
            indications_am: zod_1.z.string().optional(),
            contraindications_en: zod_1.z.string().optional(),
            contraindications_am: zod_1.z.string().optional(),
            side_effects_en: zod_1.z.string().optional(),
            side_effects_am: zod_1.z.string().optional(),
            dosage_instructions_en: zod_1.z.string().optional(),
            dosage_instructions_am: zod_1.z.string().optional(),
            storage_info_en: zod_1.z.string().optional(),
            storage_info_am: zod_1.z.string().optional(),
            warnings_en: zod_1.z.string().optional(),
            warnings_am: zod_1.z.string().optional(),
        })
            .optional(),
    }),
});
exports.updateProductPriceSchema = zod_1.z.object({
    body: zod_1.z.object({
        sellingPrice: zod_1.z.number().positive('Selling price must be greater than 0'),
        reason: zod_1.z.string().min(2, 'Reason for price update is required'),
    }),
});
exports.updateProductStatusSchema = zod_1.z.object({
    body: zod_1.z.object({
        isActive: zod_1.z.boolean(),
    }),
});
//# sourceMappingURL=products.schema.js.map