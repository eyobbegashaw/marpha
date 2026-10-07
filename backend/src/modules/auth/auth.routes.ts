import { Router } from 'express';
import { authController } from './auth.controller';
import { validateRequest } from '../../common/middlewares/validateRequest';
import { authMiddleware } from '../../common/middlewares/authMiddleware';
import {
  loginSchema,
  registerSchema,
  changePasswordSchema,
  firstLoginChangePasswordSchema,
  forgotPasswordRequestSchema,
  verifyAndResetPasswordSchema,
  updateLanguageSchema,
} from './auth.schema';

const router = Router();

router.post('/register', validateRequest(registerSchema), (req, res, next) => authController.register(req, res, next));
router.post('/login', validateRequest(loginSchema), (req, res, next) => authController.login(req, res, next));
router.post('/first-login-change-password', authMiddleware, validateRequest(firstLoginChangePasswordSchema), (req, res, next) => authController.firstLoginChangePassword(req, res, next));
router.post('/forgot-password', validateRequest(forgotPasswordRequestSchema), (req, res, next) => authController.forgotPassword(req, res, next));
router.post('/verify-and-reset-password', validateRequest(verifyAndResetPasswordSchema), (req, res, next) => authController.verifyAndResetPassword(req, res, next));
router.get('/profile', authMiddleware, (req, res, next) => authController.getProfile(req, res, next));
router.post('/change-password', authMiddleware, validateRequest(changePasswordSchema), (req, res, next) => authController.changePassword(req, res, next));
router.post('/language', authMiddleware, validateRequest(updateLanguageSchema), (req, res, next) => authController.updateLanguage(req, res, next));

export default router;
