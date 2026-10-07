import { z } from 'zod';

export const createUserSchema = z.object({
  body: z.object({
    branchId: z.string().uuid().optional(),
    roleName: z.enum(['PHARMACIST', 'CUSTOMER', 'PHARMACY_OWNER']).optional(),
    role: z.enum(['PHARMACIST', 'CUSTOMER', 'PHARMACY_OWNER']).optional(),
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    fullName: z.string().optional(),
    email: z.string().email('Valid email is required'),
    phone: z.string().optional(),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    languagePreference: z.enum(['en', 'am']).default('en').optional(),
  }),
});

export const updateUserSchema = z.object({
  body: z.object({
    branchId: z.string().uuid().optional(),
    roleName: z.enum(['PHARMACIST', 'CUSTOMER', 'PHARMACY_OWNER']).optional(),
    role: z.enum(['PHARMACIST', 'CUSTOMER', 'PHARMACY_OWNER']).optional(),
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    fullName: z.string().optional(),
    phone: z.string().optional(),
    isActive: z.boolean().optional(),
    is_active: z.boolean().optional(),
    languagePreference: z.enum(['en', 'am']).optional(),
  }),
});

export const toggleUserStatusSchema = z.object({
  body: z.object({
    isActive: z.boolean().optional(),
    is_active: z.boolean().optional(),
  }),
});
