import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { ApiResponse } from '../../common/utils/apiResponse';
import { logAuditEvent } from '../../common/middlewares/auditLoggerMiddleware';

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.registerOwner(req.body);
      await logAuditEvent(req, 'REGISTER_PHARMACY', 'organizations', result.organization.id, { email: req.body.email });
      return ApiResponse.created(res, result, 'Pharmacy registered successfully');
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, username, identifier, password, tenantCode, pharmacySlug } = req.body;
      const targetId = identifier || username || email;
      const result = await authService.login(targetId, password, pharmacySlug || tenantCode);
      await logAuditEvent(req, 'LOGIN', 'users', result.user.id, { identifier: targetId });
      return ApiResponse.success(res, result, 'Login successful');
    } catch (error) {
      next(error);
    }
  }

  async firstLoginChangePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { newPassword } = req.body;
      const result = await authService.firstLoginChangePassword(req.user!.id, newPassword);
      await logAuditEvent(req, 'FIRST_LOGIN_PASSWORD_CONVERTED', 'users', req.user!.id);
      return ApiResponse.success(res, result, 'Default password successfully replaced with personal password');
    } catch (error) {
      next(error);
    }
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { identifier, pharmacySlug, tenantCode } = req.body;
      const result = await authService.requestForgotPassword(identifier, pharmacySlug || tenantCode);
      return ApiResponse.success(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }

  async verifyAndResetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { identifier, resetCode, newPassword } = req.body;
      const result = await authService.verifyAndResetPassword(identifier, resetCode, newPassword);
      return ApiResponse.success(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }

  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.getProfile(req.user!.id);
      return ApiResponse.success(res, result, 'User profile fetched successfully');
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { currentPassword, newPassword } = req.body;
      const result = await authService.changePassword(req.user!.id, currentPassword, newPassword);
      await logAuditEvent(req, 'CHANGE_PASSWORD', 'users', req.user!.id);
      return ApiResponse.success(res, result, 'Password changed successfully');
    } catch (error) {
      next(error);
    }
  }

  async updateLanguage(req: Request, res: Response, next: NextFunction) {
    try {
      const { language } = req.body;
      const result = await authService.updateLanguage(req.user!.id, language);
      return ApiResponse.success(res, result, 'Language updated successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
