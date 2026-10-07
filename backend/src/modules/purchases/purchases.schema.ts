import { z } from 'zod';

export const createPurchaseSchema = z.object({
  body: z.object({
    branchId: z.string().uuid(),
    supplierId: z.string().uuid(),
    destinationLocationId: z.string().uuid(), // Must be a Warehouse
    invoiceNumber: z.string().optional(),
    purchaseDate: z.string().optional(),
    status: z.enum(['DRAFT', 'SUBMITTED', 'ORDERED']).default('DRAFT'),
    notes: z.string().optional(),
    items: z
      .array(
        z.object({
          productId: z.string().uuid(),
          batchNumber: z.string().min(1),
          manufacturingDate: z.string().optional(),
          expiryDate: z.string().min(4, 'Valid expiry date required (YYYY-MM-DD)'),
          quantityOrdered: z.number().positive(),
          unitCost: z.number().nonnegative(),
          unitSellingPrice: z.number().nonnegative(),
        })
      )
      .min(1, 'At least one item is required in a purchase order'),
  }),
});

export const receivePurchaseSchema = z.object({
  body: z.object({
    receivedItems: z
      .array(
        z.object({
          itemId: z.string().uuid(),
          quantityReceived: z.number().positive(),
        })
      )
      .optional(),
  }),
});

export const cancelPurchaseSchema = z.object({
  body: z.object({
    reason: z.string().min(2, 'Reason for cancellation is required'),
  }),
});
