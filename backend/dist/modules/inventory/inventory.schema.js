"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordLossSchema = exports.adjustStockSchema = exports.transferStockSchema = void 0;
const zod_1 = require("zod");
exports.transferStockSchema = zod_1.z.object({
    body: zod_1.z.object({
        productId: zod_1.z.string().uuid(),
        batchId: zod_1.z.string().uuid(),
        sourceLocationId: zod_1.z.string().uuid(),
        destinationLocationId: zod_1.z.string().uuid(),
        quantity: zod_1.z.number().positive('Transfer quantity must be greater than 0'),
        notes: zod_1.z.string().optional(),
    }),
});
exports.adjustStockSchema = zod_1.z.object({
    body: zod_1.z.object({
        locationId: zod_1.z.string().uuid(),
        productId: zod_1.z.string().uuid(),
        batchId: zod_1.z.string().uuid(),
        countedQuantity: zod_1.z.number().nonnegative('Counted quantity cannot be negative'),
        reason: zod_1.z.string().min(3, 'Reason for adjustment is required'),
    }),
});
exports.recordLossSchema = zod_1.z.object({
    body: zod_1.z.object({
        locationId: zod_1.z.string().uuid(),
        productId: zod_1.z.string().uuid(),
        batchId: zod_1.z.string().uuid(),
        quantity: zod_1.z.number().positive('Loss quantity must be greater than 0'),
        lossType: zod_1.z.enum(['DAMAGE', 'EXPIRED']),
        notes: zod_1.z.string().min(3, 'Notes/reason for loss record is required'),
    }),
});
//# sourceMappingURL=inventory.schema.js.map