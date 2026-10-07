import { Request, Response, NextFunction } from 'express';
import { analyticsService } from './analytics.service';
import { ApiResponse } from '../../common/utils/apiResponse';

export class AnalyticsController {
  async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.user!.organization_id!;
      const branchId = (req.query.branchId as string) || undefined;
      const period = (req.query.period as string) || 'today';
      const customStart = req.query.startDate as string | undefined;
      const customEnd = req.query.endDate as string | undefined;

      const data = await analyticsService.getDashboardSummary(orgId, branchId, period, customStart, customEnd);
      return ApiResponse.success(res, data, 'Analytics dashboard summary retrieved');
    } catch (error) {
      next(error);
    }
  }

  async getTopSelling(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.user!.organization_id!;
      const branchId = (req.query.branchId as string) || undefined;
      const period = (req.query.period as string) || '30days';
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      const customStart = req.query.startDate as string | undefined;
      const customEnd = req.query.endDate as string | undefined;

      const data = await analyticsService.getTopSellingMedicines(orgId, branchId, period, limit, customStart, customEnd);
      return ApiResponse.success(res, data, 'Top selling medicines retrieved');
    } catch (error) {
      next(error);
    }
  }

  async getCategorySales(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.user!.organization_id!;
      const branchId = (req.query.branchId as string) || undefined;
      const period = (req.query.period as string) || '30days';
      const customStart = req.query.startDate as string | undefined;
      const customEnd = req.query.endDate as string | undefined;

      const data = await analyticsService.getCategorySales(orgId, branchId, period, customStart, customEnd);
      return ApiResponse.success(res, data, 'Sales by category retrieved');
    } catch (error) {
      next(error);
    }
  }

  async getDemandRecommendations(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.user!.organization_id!;
      const branchId = (req.query.branchId as string) || undefined;

      const data = await analyticsService.getDemandAndReorderRecommendations(orgId, branchId);
      return ApiResponse.success(res, data, 'Demand restock recommendations retrieved');
    } catch (error) {
      next(error);
    }
  }
}

export const analyticsController = new AnalyticsController();
