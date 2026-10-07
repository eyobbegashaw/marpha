import { Request, Response, NextFunction } from 'express';
import { expensesService } from './expenses.service';
import { ApiResponse } from '../../common/utils/apiResponse';
import { logAuditEvent } from '../../common/middlewares/auditLoggerMiddleware';

export class ExpensesController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.user!.organization_id!;
      const branchId = (req.query.branchId as string) || undefined;
      const startDate = (req.query.startDate as string) || undefined;
      const endDate = (req.query.endDate as string) || undefined;
      const isVoided = req.query.isVoided !== undefined ? req.query.isVoided === 'true' : undefined;
      const data = await expensesService.listExpenses(orgId, branchId, startDate, endDate, isVoided);
      return ApiResponse.success(res, data, 'Expenses retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.user!.organization_id!;
      const data = await expensesService.getExpenseById(orgId, req.params.id);
      return ApiResponse.success(res, data, 'Expense retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.user!.organization_id!;
      const userId = req.user!.id;
      const data = await expensesService.createExpense(orgId, userId, req.body);
      await logAuditEvent(req, 'RECORD_EXPENSE', 'expenses', data.id, { category: data.expense_category, amount: data.amount });
      return ApiResponse.created(res, data, 'Expense recorded successfully');
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.user!.organization_id!;
      const data = await expensesService.updateExpense(orgId, req.params.id, req.body);
      await logAuditEvent(req, 'UPDATE_EXPENSE', 'expenses', data.id, req.body);
      return ApiResponse.success(res, data, 'Expense updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async void(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.user!.organization_id!;
      const userId = req.user!.id;
      const { reason } = req.body;
      const data = await expensesService.voidExpense(orgId, req.params.id, userId, reason);
      await logAuditEvent(req, 'VOID_EXPENSE', 'expenses', data.id, { reason });
      return ApiResponse.success(res, data, 'Expense voided successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const expensesController = new ExpensesController();
