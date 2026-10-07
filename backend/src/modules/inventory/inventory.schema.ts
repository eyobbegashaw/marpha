import { z } from 'zod';

export const transferStockSchema = z.object({
  body: z.object({
    productId: z.string().uuid(),
    batchId: z.string().uuid(),
    sourceLocationId: z.string().uuid(),
    destinationLocationId: z.string().uuid(),
    quantity: z.number().positive('Transfer quantity must be greater than 0'),
    notes: z.string().optional(),
  }),
});

export const adjustStockSchema = z.object({
  body: z.object({
    locationId: z.string().uuid(),
    productId: z.string().uuid(),
    batchId: z.string().uuid(),
    countedQuantity: z.number().nonnegative('Counted quantity cannot be negative'),
    reason: z.string().min(3, 'Reason for adjustment is required'),
  }),
});

export const recordLossSchema = z.object({
  body: z.object({
    locationId: z.string().uuid(),
    productId: z.string().uuid(),
    batchId: z.string().uuid(),
    quantity: z.number().positive('Loss quantity must be greater than 0'),
    lossType: z.enum(['DAMAGE', 'EXPIRED']),
    notes: z.string().min(3, 'Notes/reason for loss record is required'),
  }),
});
