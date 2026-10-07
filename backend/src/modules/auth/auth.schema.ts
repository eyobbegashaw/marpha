import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    email: z.string().optional(),
    username: z.string().optional(),
    identifier: z.string().optional(),
    password: z.string().min(1, 'Password is required'),
    tenantCode: z.string().optional(),
    pharmacySlug: z.string().optional(),
  }).refine((data) => data.email || data.username || data.identifier, {
    message: 'Username or email is required',
    path: ['identifier'],
  }),
});

export const registerSchema = z.object({
  body: z.object({
    organizationName: z.string().min(2, 'Organization name is required'),
    organizationCode: z.string().min(2, 'Organization code is required'),
    branchName: z.string().min(2, 'Branch name is required'),
    branchCode: z.string().min(2, 'Branch code is required'),
    username: z.string().min(2).optional(),
    firstName: z.string().min(2, 'First name is required'),
    lastName: z.string().min(2, 'Last name is required'),
    email: z.string().email('Valid email is required'),
    phone: z.string().optional(),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    languagePreference: z.enum(['en', 'am']).default('en'),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(6, 'Current password must be at least 6 characters'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  }),
});

export const firstLoginChangePasswordSchema = z.object({
  body: z.object({
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Password confirmation is required'),
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }),
});

export const forgotPasswordRequestSchema = z.object({
  body: z.object({
    identifier: z.string().min(2, 'Username or email is required'),
    pharmacySlug: z.string().optional(),
    tenantCode: z.string().optional(),
  }),
});

export const verifyAndResetPasswordSchema = z.object({
  body: z.object({
    identifier: z.string().min(2, 'Username or email is required'),
    resetCode: z.string().min(4, 'Valid reset code is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Password confirmation is required'),
    pharmacySlug: z.string().optional(),
    tenantCode: z.string().optional(),
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }),
});

export const ownerResetPasswordSchema = z.object({
  body: z.object({
    newPassword: z.string().min(6, 'Temporary password must be at least 6 characters').optional(),
  }),
});

export const updateLanguageSchema = z.object({
  body: z.object({
    language: z.enum(['en', 'am']),
  }),
});
