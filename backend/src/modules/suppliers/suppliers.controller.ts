import { Request, Response, NextFunction } from 'express';
import { suppliersService } from './suppliers.service';
import { ApiResponse } from '../../common/utils/apiResponse';

export class SuppliersController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.user!.organization_id!;
      const data = await suppliersService.listSuppliers(orgId);
      return ApiResponse.success(res, data, 'Suppliers retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.user!.organization_id!;
      const data = await suppliersService.getSupplierById(orgId, req.params.id);
      return ApiResponse.success(res, data, 'Supplier retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.user!.organization_id!;
      const data = await suppliersService.createSupplier(orgId, req.body);
      return ApiResponse.created(res, data, 'Supplier created successfully');
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.user!.organization_id!;
      const data = await suppliersService.updateSupplier(orgId, req.params.id, req.body);
      return ApiResponse.success(res, data, 'Supplier updated successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const suppliersController = new SuppliersController();
