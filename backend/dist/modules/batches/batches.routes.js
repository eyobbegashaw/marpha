"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const batches_controller_1 = require("./batches.controller");
const authMiddleware_1 = require("../../common/middlewares/authMiddleware");
const rbacMiddleware_1 = require("../../common/middlewares/rbacMiddleware");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authMiddleware);
router.get('/', (0, rbacMiddleware_1.requireRoles)('PHARMACY_OWNER', 'PHARMACIST'), (req, res, next) => batches_controller_1.batchesController.list(req, res, next));
router.get('/:id', (0, rbacMiddleware_1.requireRoles)('PHARMACY_OWNER', 'PHARMACIST'), (req, res, next) => batches_controller_1.batchesController.getById(req, res, next));
router.post('/', (0, rbacMiddleware_1.requireRoles)('PHARMACY_OWNER', 'PHARMACIST'), (req, res, next) => batches_controller_1.batchesController.create(req, res, next));
router.patch('/:id/quarantine', (0, rbacMiddleware_1.requireRoles)('PHARMACY_OWNER', 'PHARMACIST'), (req, res, next) => batches_controller_1.batchesController.updateQuarantine(req, res, next));
exports.default = router;
//# sourceMappingURL=batches.routes.js.map