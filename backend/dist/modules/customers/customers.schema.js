"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCustomerSchema = exports.createCustomerSchema = void 0;
const zod_1 = require("zod");
exports.createCustomerSchema = zod_1.z.object({
    body: zod_1.z.object({
        firstName: zod_1.z.string().min(2),
        lastName: zod_1.z.string().min(2),
        phone: zod_1.z.string().optional(),
        email: zod_1.z.string().email().optional(),
        address: zod_1.z.string().optional(),
        dateOfBirth: zod_1.z.string().optional(),
        gender: zod_1.z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
        allergies: zod_1.z.string().optional(),
        chronicConditions: zod_1.z.string().optional(),
    }),
});
exports.updateCustomerSchema = zod_1.z.object({
    body: zod_1.z.object({
        firstName: zod_1.z.string().min(2).optional(),
        lastName: zod_1.z.string().min(2).optional(),
        phone: zod_1.z.string().optional(),
        email: zod_1.z.string().email().optional(),
        address: zod_1.z.string().optional(),
        dateOfBirth: zod_1.z.string().optional(),
        gender: zod_1.z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
        allergies: zod_1.z.string().optional(),
        chronicConditions: zod_1.z.string().optional(),
        isActive: zod_1.z.boolean().optional(),
    }),
});
//# sourceMappingURL=customers.schema.js.map