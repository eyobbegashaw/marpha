"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleUserStatusSchema = exports.updateUserSchema = exports.createUserSchema = void 0;
const zod_1 = require("zod");
exports.createUserSchema = zod_1.z.object({
    body: zod_1.z.object({
        branchId: zod_1.z.string().uuid().optional(),
        roleName: zod_1.z.enum(['PHARMACIST', 'CUSTOMER', 'PHARMACY_OWNER']).default('PHARMACIST'),
        firstName: zod_1.z.string().min(2, 'First name is required'),
        lastName: zod_1.z.string().min(2, 'Last name is required'),
        email: zod_1.z.string().email('Valid email is required'),
        phone: zod_1.z.string().optional(),
        password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
        languagePreference: zod_1.z.enum(['en', 'am']).default('en'),
    }),
});
exports.updateUserSchema = zod_1.z.object({
    body: zod_1.z.object({
        branchId: zod_1.z.string().uuid().optional(),
        roleName: zod_1.z.enum(['PHARMACIST', 'CUSTOMER', 'PHARMACY_OWNER']).optional(),
        firstName: zod_1.z.string().min(2).optional(),
        lastName: zod_1.z.string().min(2).optional(),
        phone: zod_1.z.string().optional(),
        isActive: zod_1.z.boolean().optional(),
        languagePreference: zod_1.z.enum(['en', 'am']).optional(),
    }),
});
exports.toggleUserStatusSchema = zod_1.z.object({
    body: zod_1.z.object({
        isActive: zod_1.z.boolean(),
    }),
});
//# sourceMappingURL=users.schema.js.map