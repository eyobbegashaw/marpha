import { Request, Response, NextFunction } from 'express';
import { auditLogsService } from './audit-logs.service';
import { ApiResponse } from '../../common/utils/apiResponse';

export class AuditLogsController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.user!.organization_id!;
      const filters = {
        userId: (req.query.userId as string) || undefined,
        action: (req.query.action as string) || undefined,
        entityName: (req.query.entityName as string) || undefined,
        startDate: (req.query.startDate as string) || undefined,
        endDate: (req.query.endDate as string) || undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 50,
        offset: req.query.offset ? parseInt(req.query.offset as string, 10) : 0,
      };
      const data = await auditLogsService.listLogs(orgId, filters);
      return ApiResponse.success(res, data, 'Audit logs retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const auditLogsController = new AuditLogsController();
