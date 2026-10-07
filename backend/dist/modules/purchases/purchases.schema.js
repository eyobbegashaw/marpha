"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancelPurchaseSchema = exports.receivePurchaseSchema = exports.createPurchaseSchema = void 0;
const zod_1 = require("zod");
exports.createPurchaseSchema = zod_1.z.object({
    body: zod_1.z.object({
        branchId: zod_1.z.string().uuid(),
        supplierId: zod_1.z.string().uuid(),
        destinationLocationId: zod_1.z.string().uuid(), // Must be a Warehouse
        invoiceNumber: zod_1.z.string().optional(),
        purchaseDate: zod_1.z.string().optional(),
        status: zod_1.z.enum(['DRAFT', 'SUBMITTED', 'ORDERED']).default('DRAFT'),
        notes: zod_1.z.string().optional(),
        items: zod_1.z
            .array(zod_1.z.object({
            productId: zod_1.z.string().uuid(),
            batchNumber: zod_1.z.string().min(1),
            manufacturingDate: zod_1.z.string().optional(),
            expiryDate: zod_1.z.string().min(4, 'Valid expiry date required (YYYY-MM-DD)'),
            quantityOrdered: zod_1.z.number().positive(),
            unitCost: zod_1.z.number().nonnegative(),
            unitSellingPrice: zod_1.z.number().nonnegative(),
        }))
            .min(1, 'At least one item is required in a purchase order'),
    }),
});
exports.receivePurchaseSchema = zod_1.z.object({
    body: zod_1.z.object({
        receivedItems: zod_1.z
            .array(zod_1.z.object({
            itemId: zod_1.z.string().uuid(),
            quantityReceived: zod_1.z.number().positive(),
        }))
            .optional(),
    }),
});
exports.cancelPurchaseSchema = zod_1.z.object({
    body: zod_1.z.object({
        reason: zod_1.z.string().min(2, 'Reason for cancellation is required'),
    }),
});
//# sourceMappingURL=purchases.schema.js.map