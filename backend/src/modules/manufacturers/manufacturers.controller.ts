import { Request, Response, NextFunction } from 'express';
import { manufacturersService } from './manufacturers.service';
import { ApiResponse } from '../../common/utils/apiResponse';

export class ManufacturersController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.user!.organization_id!;
      const data = await manufacturersService.listManufacturers(orgId);
      return ApiResponse.success(res, data, 'Manufacturers retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.user!.organization_id!;
      const data = await manufacturersService.getManufacturerById(orgId, req.params.id);
      return ApiResponse.success(res, data, 'Manufacturer retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.user!.organization_id!;
      const data = await manufacturersService.createManufacturer(orgId, req.body);
      return ApiResponse.created(res, data, 'Manufacturer created successfully');
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.user!.organization_id!;
      const data = await manufacturersService.updateManufacturer(orgId, req.params.id, req.body);
      return ApiResponse.success(res, data, 'Manufacturer updated successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const manufacturersController = new ManufacturersController();
