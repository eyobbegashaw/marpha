import { Request, Response, NextFunction } from 'express';
import { organizationsService } from './organizations.service';
import { ApiResponse } from '../../common/utils/apiResponse';
import { logAuditEvent } from '../../common/middlewares/auditLoggerMiddleware';

export class OrganizationsController {
  async getOrg(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.user!.organization_id!;
      const org = await organizationsService.getOrganization(orgId);
      return ApiResponse.success(res, org, 'Organization details retrieved');
    } catch (error) {
      next(error);
    }
  }

  async updateOrg(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.user!.organization_id!;
      const org = await organizationsService.updateOrganization(orgId, req.body);
      await logAuditEvent(req, 'UPDATE_ORGANIZATION', 'organizations', orgId, req.body);
      return ApiResponse.success(res, org, 'Organization updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async listBranches(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.user!.organization_id!;
      const branches = await organizationsService.listBranches(orgId);
      return ApiResponse.success(res, branches, 'Branches retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async createBranch(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.user!.organization_id!;
      const branch = await organizationsService.createBranch(orgId, req.body);
      await logAuditEvent(req, 'CREATE_BRANCH', 'branches', branch.id, { name: branch.name, code: branch.code });
      return ApiResponse.created(res, branch, 'Branch created successfully');
    } catch (error) {
      next(error);
    }
  }

  async updateBranch(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.user!.organization_id!;
      const branch = await organizationsService.updateBranch(orgId, req.params.branchId, req.body);
      await logAuditEvent(req, 'UPDATE_BRANCH', 'branches', branch.id, req.body);
      return ApiResponse.success(res, branch, 'Branch updated successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const organizationsController = new OrganizationsController();
