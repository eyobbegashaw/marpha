"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const customers_controller_1 = require("./customers.controller");
const authMiddleware_1 = require("../../common/middlewares/authMiddleware");
const validateRequest_1 = require("../../common/middlewares/validateRequest");
const customers_schema_1 = require("./customers.schema");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authMiddleware);
router.get('/', (req, res, next) => customers_controller_1.customersController.list(req, res, next));
router.get('/:id', (req, res, next) => customers_controller_1.customersController.getById(req, res, next));
router.post('/', (0, validateRequest_1.validateRequest)(customers_schema_1.createCustomerSchema), (req, res, next) => customers_controller_1.customersController.create(req, res, next));
router.put('/:id', (0, validateRequest_1.validateRequest)(customers_schema_1.updateCustomerSchema), (req, res, next) => customers_controller_1.customersController.update(req, res, next));
exports.default = router;
//# sourceMappingURL=customers.routes.js.map