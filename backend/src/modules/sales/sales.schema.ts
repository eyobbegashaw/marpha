import { z } from 'zod';

export const createSaleSchema = z.object({
  body: z.object({
    branchId: z.string().uuid(),
    locationId: z.string().uuid(), // Front Sales Shelf
    buyerId: z.string().uuid().optional(), // Optional registered user ID who purchased
    discountAmount: z.number().nonnegative().default(0),
    taxAmount: z.number().nonnegative().default(0),
    offlineSyncId: z.string().optional(),
    notes: z.string().optional(),
    items: z
      .array(
        z.object({
          productId: z.string().uuid(),
          batchId: z.string().uuid().optional(), // If omitted, FEFO will auto-select
          quantity: z.number().positive('Quantity must be greater than 0'),
          unitPrice: z.number().positive().optional(), // Overrides default product price if authorized
          discount: z.number().nonnegative().default(0),
        })
      )
      .min(1, 'Sale must contain at least one medicine'),
  }),
});
