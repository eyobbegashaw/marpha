"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateLanguageSchema = exports.changePasswordSchema = exports.registerSchema = exports.loginSchema = void 0;
const zod_1 = require("zod");
exports.loginSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email('Valid email is required'),
        password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
    }),
});
exports.registerSchema = zod_1.z.object({
    body: zod_1.z.object({
        organizationName: zod_1.z.string().min(2, 'Organization name is required'),
        organizationCode: zod_1.z.string().min(2, 'Organization code is required'),
        branchName: zod_1.z.string().min(2, 'Branch name is required'),
        branchCode: zod_1.z.string().min(2, 'Branch code is required'),
        firstName: zod_1.z.string().min(2, 'First name is required'),
        lastName: zod_1.z.string().min(2, 'Last name is required'),
        email: zod_1.z.string().email('Valid email is required'),
        phone: zod_1.z.string().optional(),
        password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
        languagePreference: zod_1.z.enum(['en', 'am']).default('en'),
    }),
});
exports.changePasswordSchema = zod_1.z.object({
    body: zod_1.z.object({
        currentPassword: zod_1.z.string().min(6),
        newPassword: zod_1.z.string().min(6),
    }),
});
exports.updateLanguageSchema = zod_1.z.object({
    body: zod_1.z.object({
        language: zod_1.z.enum(['en', 'am']),
    }),
});
//# sourceMappingURL=auth.schema.js.map