import { Request, Response, NextFunction } from 'express';
import { usersService } from './users.service';
import { authService } from '../auth/auth.service';
import { ApiResponse } from '../../common/utils/apiResponse';
import { logAuditEvent } from '../../common/middlewares/auditLoggerMiddleware';

export class UsersController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.user!.organization_id!;
      const branchId = req.query.branchId as string | undefined;
      const roleName = req.query.roleName as string | undefined;
      const users = await usersService.listUsers(orgId, branchId, roleName);
      return ApiResponse.success(res, users, 'Users retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.user!.organization_id!;
      const user = await usersService.getUserById(orgId, req.params.id);
      return ApiResponse.success(res, user, 'User retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.user!.organization_id!;
      const user = await usersService.createUser(orgId, req.body);
      await logAuditEvent(req, 'CREATE_USER', 'users', user.id, { email: user.email, username: user.username, role: user.role });
      return ApiResponse.created(res, user, 'User created successfully');
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.user!.organization_id!;
      const user = await usersService.updateUser(orgId, req.params.id, req.body);
      await logAuditEvent(req, 'UPDATE_USER', 'users', user.id, req.body);
      return ApiResponse.success(res, user, 'User updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async toggleStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.user!.organization_id!;
      const isActive = req.body.isActive !== undefined ? req.body.isActive : req.body.is_active;
      const user = await usersService.setUserStatus(orgId, req.params.id, Boolean(isActive));
      const action = isActive ? 'ACTIVATE_USER' : 'DEACTIVATE_USER';
      await logAuditEvent(req, action, 'users', user.id, { isActive });
      return ApiResponse.success(res, user, `User account ${isActive ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.user!.organization_id!;
      const { newPassword } = req.body;
      const result = await authService.ownerResetPharmacistPassword(orgId, req.user!.id, req.params.id, newPassword);
      await logAuditEvent(req, 'OWNER_RESET_PHARMACIST_PASSWORD', 'users', req.params.id, { resetBy: req.user!.id });
      return ApiResponse.success(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }

  async listResetRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.user!.organization_id!;
      const requests = await authService.listPasswordResetRequests(orgId);
      return ApiResponse.success(res, requests, 'Password reset requests retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const usersController = new UsersController();
