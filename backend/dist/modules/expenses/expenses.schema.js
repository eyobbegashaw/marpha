"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.voidExpenseSchema = exports.updateExpenseSchema = exports.createExpenseSchema = void 0;
const zod_1 = require("zod");
exports.createExpenseSchema = zod_1.z.object({
    body: zod_1.z.object({
        branchId: zod_1.z.string().uuid(),
        expenseCategory: zod_1.z.string().min(2),
        description: zod_1.z.string().min(2),
        amount: zod_1.z.number().positive(),
        expenseDate: zod_1.z.string().optional(),
    }),
});
exports.updateExpenseSchema = zod_1.z.object({
    body: zod_1.z.object({
        branchId: zod_1.z.string().uuid().optional(),
        expenseCategory: zod_1.z.string().min(2).optional(),
        description: zod_1.z.string().min(2).optional(),
        amount: zod_1.z.number().positive().optional(),
        expenseDate: zod_1.z.string().optional(),
    }),
});
exports.voidExpenseSchema = zod_1.z.object({
    body: zod_1.z.object({
        reason: zod_1.z.string().min(2, 'Reason for voiding expense is required'),
    }),
});
//# sourceMappingURL=expenses.schema.js.map