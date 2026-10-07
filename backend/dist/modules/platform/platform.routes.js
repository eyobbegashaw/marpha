"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const platform_controller_1 = require("./platform.controller");
const authMiddleware_1 = require("../../common/middlewares/authMiddleware");
const rbacMiddleware_1 = require("../../common/middlewares/rbacMiddleware");
const validateRequest_1 = require("../../common/middlewares/validateRequest");
const platform_schema_1 = require("./platform.schema");
const router = (0, express_1.Router)();
// 1. Public Runtime Bootstrap Endpoint (Used by React & Flutter at application startup)
router.get('/config/public', authMiddleware_1.optionalAuthMiddleware, (req, res, next) => platform_controller_1.platformController.getPublicConfiguration(req, res, next));
// 2. Platform Administration (Strictly PLATFORM_ADMIN Only)
router.use(authMiddleware_1.authMiddleware);
router.use((0, rbacMiddleware_1.requireRoles)('PLATFORM_ADMIN'));
router.get('/pharmacies', (req, res, next) => platform_controller_1.platformController.listPharmacies(req, res, next));
router.post('/', (0, validateRequest_1.validateRequest)(platform_schema_1.createPharmacySchema), (req, res, next) => platform_controller_1.platformController.createPharmacy(req, res, next));
router.post('/pharmacies', (0, validateRequest_1.validateRequest)(platform_schema_1.createPharmacySchema), (req, res, next) => platform_controller_1.platformController.createPharmacy(req, res, next));
router.get('/pharmacies/:id/configuration', (req, res, next) => platform_controller_1.platformController.getConfiguration(req, res, next));
router.patch('/pharmacies/:id/branding', (0, validateRequest_1.validateRequest)(platform_schema_1.updateBrandingSchema), (req, res, next) => platform_controller_1.platformController.updateBranding(req, res, next));
router.patch('/pharmacies/:id/content', (0, validateRequest_1.validateRequest)(platform_schema_1.updateContentSchema), (req, res, next) => platform_controller_1.platformController.updateContent(req, res, next));
router.patch('/pharmacies/:id/settings', (0, validateRequest_1.validateRequest)(platform_schema_1.updateSettingsSchema), (req, res, next) => platform_controller_1.platformController.updateSettings(req, res, next));
router.patch('/pharmacies/:id/features', (0, validateRequest_1.validateRequest)(platform_schema_1.updateFeaturesSchema), (req, res, next) => platform_controller_1.platformController.updateFeatures(req, res, next));
router.post('/pharmacies/:id/preview', (req, res, next) => platform_controller_1.platformController.previewConfiguration(req, res, next));
exports.default = router;
//# sourceMappingURL=platform.routes.js.map