import { Request, Response, NextFunction } from 'express';
import { categoriesService } from './categories.service';
import { ApiResponse } from '../../common/utils/apiResponse';
import { db } from '../../database/connection';

async function resolveOrgId(req: Request): Promise<string> {
  if (req.user?.organization_id) return req.user.organization_id;
  if (req.query.organizationId) return req.query.organizationId as string;
  const res = await db.query('SELECT id FROM organizations WHERE is_active = TRUE LIMIT 1');
  return res.rows[0]?.id;
}

export class CategoriesController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = await resolveOrgId(req);
      const categories = await categoriesService.listCategories(orgId);
      return ApiResponse.success(res, categories, 'Categories retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = await resolveOrgId(req);
      const category = await categoriesService.getCategoryById(orgId, req.params.id);
      return ApiResponse.success(res, category, 'Category retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.user!.organization_id!;
      const category = await categoriesService.createCategory(orgId, req.body);
      return ApiResponse.created(res, category, 'Category created successfully');
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.user!.organization_id!;
      const category = await categoriesService.updateCategory(orgId, req.params.id, req.body);
      return ApiResponse.success(res, category, 'Category updated successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const categoriesController = new CategoriesController();
