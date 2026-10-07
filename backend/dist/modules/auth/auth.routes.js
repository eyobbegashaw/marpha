"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("./auth.controller");
const validateRequest_1 = require("../../common/middlewares/validateRequest");
const authMiddleware_1 = require("../../common/middlewares/authMiddleware");
const auth_schema_1 = require("./auth.schema");
const router = (0, express_1.Router)();
router.post('/register', (0, validateRequest_1.validateRequest)(auth_schema_1.registerSchema), (req, res, next) => auth_controller_1.authController.register(req, res, next));
router.post('/login', (0, validateRequest_1.validateRequest)(auth_schema_1.loginSchema), (req, res, next) => auth_controller_1.authController.login(req, res, next));
router.get('/profile', authMiddleware_1.authMiddleware, (req, res, next) => auth_controller_1.authController.getProfile(req, res, next));
router.post('/change-password', authMiddleware_1.authMiddleware, (0, validateRequest_1.validateRequest)(auth_schema_1.changePasswordSchema), (req, res, next) => auth_controller_1.authController.changePassword(req, res, next));
router.post('/language', authMiddleware_1.authMiddleware, (0, validateRequest_1.validateRequest)(auth_schema_1.updateLanguageSchema), (req, res, next) => auth_controller_1.authController.updateLanguage(req, res, next));
exports.default = router;
//# sourceMappingURL=auth.routes.js.map