import { Request, Response, NextFunction } from 'express';
import { notificationsService } from './notifications.service';
import { ApiResponse } from '../../common/utils/apiResponse';

export class NotificationsController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.user!.organization_id!;
      const branchId = (req.query.branchId as string) || undefined;
      const isRead = req.query.isRead !== undefined ? req.query.isRead === 'true' : undefined;
      const isResolved = req.query.isResolved !== undefined ? req.query.isResolved === 'true' : undefined;
      const data = await notificationsService.listNotifications(orgId, req.user!.id, branchId, isRead, isResolved);
      return ApiResponse.success(res, data, 'Notifications retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.user!.organization_id!;
      const data = await notificationsService.markAsRead(orgId, req.params.id);
      return ApiResponse.success(res, data, 'Notification marked as read');
    } catch (error) {
      next(error);
    }
  }

  async markAsResolved(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.user!.organization_id!;
      const userId = req.user!.id;
      const data = await notificationsService.markAsResolved(orgId, req.params.id, userId);
      return ApiResponse.success(res, data, 'Notification marked as resolved');
    } catch (error) {
      next(error);
    }
  }

  async markAllAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.user!.organization_id!;
      const data = await notificationsService.markAllAsRead(orgId, req.user!.id);
      return ApiResponse.success(res, data, 'All notifications marked as read');
    } catch (error) {
      next(error);
    }
  }

  async triggerExpiryCheck(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.user!.organization_id!;
      await notificationsService.evaluateExpiryAlerts(orgId);
      return ApiResponse.success(res, { message: 'Expiry evaluation completed' }, 'Batch expiry check executed');
    } catch (error) {
      next(error);
    }
  }
}

export const notificationsController = new NotificationsController();
