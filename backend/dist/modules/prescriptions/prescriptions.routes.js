"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prescriptions_controller_1 = require("./prescriptions.controller");
const authMiddleware_1 = require("../../common/middlewares/authMiddleware");
const rbacMiddleware_1 = require("../../common/middlewares/rbacMiddleware");
const validateRequest_1 = require("../../common/middlewares/validateRequest");
const prescriptions_schema_1 = require("./prescriptions.schema");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authMiddleware);
router.get('/', (0, rbacMiddleware_1.requireRoles)('PHARMACY_OWNER', 'PHARMACIST'), (req, res, next) => prescriptions_controller_1.prescriptionsController.list(req, res, next));
router.get('/:id', (0, rbacMiddleware_1.requireRoles)('PHARMACY_OWNER', 'PHARMACIST'), (req, res, next) => prescriptions_controller_1.prescriptionsController.getById(req, res, next));
router.post('/', (0, rbacMiddleware_1.requireRoles)('PHARMACY_OWNER', 'PHARMACIST'), (0, validateRequest_1.validateRequest)(prescriptions_schema_1.createPrescriptionSchema), (req, res, next) => prescriptions_controller_1.prescriptionsController.create(req, res, next));
exports.default = router;
//# sourceMappingURL=prescriptions.routes.js.map