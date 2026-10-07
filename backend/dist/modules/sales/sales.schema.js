"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSaleSchema = void 0;
const zod_1 = require("zod");
exports.createSaleSchema = zod_1.z.object({
    body: zod_1.z.object({
        branchId: zod_1.z.string().uuid(),
        locationId: zod_1.z.string().uuid(), // Front Sales Shelf
        buyerId: zod_1.z.string().uuid().optional(), // Optional registered user ID who purchased
        discountAmount: zod_1.z.number().nonnegative().default(0),
        taxAmount: zod_1.z.number().nonnegative().default(0),
        offlineSyncId: zod_1.z.string().optional(),
        notes: zod_1.z.string().optional(),
        items: zod_1.z
            .array(zod_1.z.object({
            productId: zod_1.z.string().uuid(),
            batchId: zod_1.z.string().uuid().optional(), // If omitted, FEFO will auto-select
            quantity: zod_1.z.number().positive('Quantity must be greater than 0'),
            unitPrice: zod_1.z.number().positive().optional(), // Overrides default product price if authorized
            discount: zod_1.z.number().nonnegative().default(0),
        }))
            .min(1, 'Sale must contain at least one medicine'),
    }),
});
//# sourceMappingURL=sales.schema.js.map