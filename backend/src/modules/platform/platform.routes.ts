import { Router } from 'express';
import { platformController } from './platform.controller';
import { authMiddleware, optionalAuthMiddleware } from '../../common/middlewares/authMiddleware';
import { requireRoles } from '../../common/middlewares/rbacMiddleware';
import { validateRequest } from '../../common/middlewares/validateRequest';
import {
  createPharmacySchema,
  updateBrandingSchema,
  updateContentSchema,
  updateSettingsSchema,
  updateFeaturesSchema,
} from './platform.schema';

const router = Router();

// 1. Public Runtime Bootstrap Endpoint (Used by React & Flutter at application startup)
router.get('/config/public', optionalAuthMiddleware, (req, res, next) =>
  platformController.getPublicConfiguration(req, res, next)
);

// 2. Platform Administration (Strictly PLATFORM_ADMIN Only)
router.use(authMiddleware);
router.use(requireRoles('PLATFORM_ADMIN'));

router.get('/pharmacies', (req, res, next) => platformController.listPharmacies(req, res, next));
router.post('/', validateRequest(createPharmacySchema), (req, res, next) =>
  platformController.createPharmacy(req, res, next)
);
router.post('/pharmacies', validateRequest(createPharmacySchema), (req, res, next) =>
  platformController.createPharmacy(req, res, next)
);

router.get('/pharmacies/:id/configuration', (req, res, next) =>
  platformController.getConfiguration(req, res, next)
);
router.patch('/pharmacies/:id/branding', validateRequest(updateBrandingSchema), (req, res, next) =>
  platformController.updateBranding(req, res, next)
);
router.patch('/pharmacies/:id/content', validateRequest(updateContentSchema), (req, res, next) =>
  platformController.updateContent(req, res, next)
);
router.patch('/pharmacies/:id/settings', validateRequest(updateSettingsSchema), (req, res, next) =>
  platformController.updateSettings(req, res, next)
);
router.patch('/pharmacies/:id/features', validateRequest(updateFeaturesSchema), (req, res, next) =>
  platformController.updateFeatures(req, res, next)
);
router.post('/pharmacies/:id/preview', (req, res, next) =>
  platformController.previewConfiguration(req, res, next)
);

export default router;
