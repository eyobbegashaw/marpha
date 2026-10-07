import { Request, Response, NextFunction } from 'express';
import { productsService } from './products.service';
import { ApiResponse } from '../../common/utils/apiResponse';
import { logAuditEvent } from '../../common/middlewares/auditLoggerMiddleware';
import { db } from '../../database/connection';

async function resolveOrgId(req: Request): Promise<string> {
  if (req.user?.organization_id) return req.user.organization_id;
  if (req.query.organizationId) return req.query.organizationId as string;
  const res = await db.query('SELECT id FROM organizations WHERE is_active = TRUE ORDER BY created_at ASC LIMIT 1');
  return res.rows[0]?.id;
}

export class ProductsController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = await resolveOrgId(req);
      const filters = {
        search: req.query.search as string | undefined,
        categoryId: req.query.categoryId as string | undefined,
        manufacturerId: req.query.manufacturerId as string | undefined,
        prescriptionRequired: req.query.prescriptionRequired !== undefined ? req.query.prescriptionRequired === 'true' : undefined,
        isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : true,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string, 10) : undefined,
      };

      const products = await productsService.listProducts(orgId, filters);
      return ApiResponse.success(res, products, 'Medicines retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = await resolveOrgId(req);
      const isStaff = req.user?.role === 'PHARMACY_OWNER' || req.user?.role === 'PHARMACIST';
      const product = await productsService.getProductById(orgId, req.params.id, isStaff);
      return ApiResponse.success(res, product, 'Medicine retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async getAvailability(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = await resolveOrgId(req);
      const branchId = req.query.branchId as string | undefined;
      const data = await productsService.getProductRealTimeAvailability(orgId, req.params.id, branchId);
      return ApiResponse.success(res, data, 'Real-time stock availability retrieved');
    } catch (error) {
      next(error);
    }
  }

  async getByBarcode(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = await resolveOrgId(req);
      const product = await productsService.getProductByBarcode(orgId, req.params.barcode);
      return ApiResponse.success(res, product, 'Medicine found');
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.user!.organization_id!;
      const product = await productsService.createProduct(orgId, req.body);
      await logAuditEvent(req, 'CREATE_PRODUCT', 'products', product.id, { genericName: product.generic_name, sku: product.sku });
      return ApiResponse.created(res, product, 'Medicine created successfully');
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.user!.organization_id!;
      const product = await productsService.updateProduct(orgId, req.params.id, req.body);
      await logAuditEvent(req, 'UPDATE_PRODUCT', 'products', product.id, req.body);
      return ApiResponse.success(res, product, 'Medicine updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.user!.organization_id!;
      const { isActive } = req.body;
      const product = await productsService.updateProductStatus(orgId, req.params.id, isActive);
      await logAuditEvent(req, isActive ? 'ACTIVATE_PRODUCT' : 'DEACTIVATE_PRODUCT', 'products', product.id, { isActive });
      return ApiResponse.success(res, product, `Medicine ${isActive ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      next(error);
    }
  }

  async updatePrice(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.user!.organization_id!;
      const userId = req.user!.id;
      const { sellingPrice, reason } = req.body;
      const result = await productsService.updateProductPrice(orgId, req.params.id, sellingPrice, reason, userId);
      await logAuditEvent(req, 'UPDATE_PRODUCT_PRICE', 'products', req.params.id, { oldPrice: result.oldPrice, newPrice: result.newPrice, reason });
      return ApiResponse.success(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }

  async getPriceHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.user!.organization_id!;
      const history = await productsService.getPriceHistory(orgId, req.params.id);
      return ApiResponse.success(res, history, 'Price history retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const productsController = new ProductsController();
