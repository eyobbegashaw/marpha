import { z } from 'zod';

export const createExpenseSchema = z.object({
  body: z.object({
    branchId: z.string().uuid(),
    expenseCategory: z.string().min(2),
    description: z.string().min(2),
    amount: z.number().positive(),
    expenseDate: z.string().optional(),
  }),
});

export const updateExpenseSchema = z.object({
  body: z.object({
    branchId: z.string().uuid().optional(),
    expenseCategory: z.string().min(2).optional(),
    description: z.string().min(2).optional(),
    amount: z.number().positive().optional(),
    expenseDate: z.string().optional(),
  }),
});

export const voidExpenseSchema = z.object({
  body: z.object({
    reason: z.string().min(2, 'Reason for voiding expense is required'),
  }),
});
