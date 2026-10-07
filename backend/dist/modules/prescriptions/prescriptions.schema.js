"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPrescriptionSchema = void 0;
const zod_1 = require("zod");
exports.createPrescriptionSchema = zod_1.z.object({
    body: zod_1.z.object({
        branchId: zod_1.z.string().uuid(),
        customerId: zod_1.z.string().uuid().optional(),
        doctorName: zod_1.z.string().min(2),
        doctorPhone: zod_1.z.string().optional(),
        hospitalClinic: zod_1.z.string().optional(),
        diagnosis: zod_1.z.string().optional(),
        prescriptionDate: zod_1.z.string().optional(),
        notes: zod_1.z.string().optional(),
        items: zod_1.z.array(zod_1.z.object({
            productId: zod_1.z.string().uuid(),
            dosage: zod_1.z.string().min(1),
            frequency: zod_1.z.string().min(1),
            duration: zod_1.z.string().min(1),
            quantityPrescribed: zod_1.z.number().positive(),
            instructions: zod_1.z.string().optional(),
        })).min(1),
    }),
});
//# sourceMappingURL=prescriptions.schema.js.map