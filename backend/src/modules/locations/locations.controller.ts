import { Request, Response, NextFunction } from 'express';
import { locationsService } from './locations.service';
import { ApiResponse } from '../../common/utils/apiResponse';
import { logAuditEvent } from '../../common/middlewares/auditLoggerMiddleware';

export class LocationsController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.user!.organization_id!;
      const branchId = (req.query.branchId as string) || req.user?.branch_id || undefined;
      const locationType = req.query.locationType as string | undefined;
      const locations = await locationsService.listLocations(orgId, branchId, locationType);
      return ApiResponse.success(res, locations, 'Locations retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.user!.organization_id!;
      const location = await locationsService.getLocationById(orgId, req.params.id);
      return ApiResponse.success(res, location, 'Location retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.user!.organization_id!;
      const location = await locationsService.createLocation(orgId, req.body);
      await logAuditEvent(req, 'CREATE_LOCATION', 'locations', location.id, { name: location.name, code: location.code });
      return ApiResponse.created(res, location, 'Location created successfully');
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.user!.organization_id!;
      const location = await locationsService.updateLocation(orgId, req.params.id, req.body);
      await logAuditEvent(req, 'UPDATE_LOCATION', 'locations', location.id, req.body);
      return ApiResponse.success(res, location, 'Location updated successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const locationsController = new LocationsController();
