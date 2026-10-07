"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expensesController = exports.ExpensesController = void 0;
const expenses_service_1 = require("./expenses.service");
const apiResponse_1 = require("../../common/utils/apiResponse");
const auditLoggerMiddleware_1 = require("../../common/middlewares/auditLoggerMiddleware");
class ExpensesController {
    async list(req, res, next) {
        try {
            const orgId = req.user.organization_id;
            const branchId = req.query.branchId || undefined;
            const startDate = req.query.startDate || undefined;
            const endDate = req.query.endDate || undefined;
            const isVoided = req.query.isVoided !== undefined ? req.query.isVoided === 'true' : undefined;
            const data = await expenses_service_1.expensesService.listExpenses(orgId, branchId, startDate, endDate, isVoided);
            return apiResponse_1.ApiResponse.success(res, data, 'Expenses retrieved successfully');
        }
        catch (error) {
            next(error);
        }
    }
    async getById(req, res, next) {
        try {
            const orgId = req.user.organization_id;
            const data = await expenses_service_1.expensesService.getExpenseById(orgId, req.params.id);
            return apiResponse_1.ApiResponse.success(res, data, 'Expense retrieved successfully');
        }
        catch (error) {
            next(error);
        }
    }
    async create(req, res, next) {
        try {
            const orgId = req.user.organization_id;
            const userId = req.user.id;
            const data = await expenses_service_1.expensesService.createExpense(orgId, userId, req.body);
            await (0, auditLoggerMiddleware_1.logAuditEvent)(req, 'RECORD_EXPENSE', 'expenses', data.id, { category: data.expense_category, amount: data.amount });
            return apiResponse_1.ApiResponse.created(res, data, 'Expense recorded successfully');
        }
        catch (error) {
            next(error);
        }
    }
    async update(req, res, next) {
        try {
            const orgId = req.user.organization_id;
            const data = await expenses_service_1.expensesService.updateExpense(orgId, req.params.id, req.body);
            await (0, auditLoggerMiddleware_1.logAuditEvent)(req, 'UPDATE_EXPENSE', 'expenses', data.id, req.body);
            return apiResponse_1.ApiResponse.success(res, data, 'Expense updated successfully');
        }
        catch (error) {
            next(error);
        }
    }
    async void(req, res, next) {
        try {
            const orgId = req.user.organization_id;
            const userId = req.user.id;
            const { reason } = req.body;
            const data = await expenses_service_1.expensesService.voidExpense(orgId, req.params.id, userId, reason);
            await (0, auditLoggerMiddleware_1.logAuditEvent)(req, 'VOID_EXPENSE', 'expenses', data.id, { reason });
            return apiResponse_1.ApiResponse.success(res, data, 'Expense voided successfully');
        }
        catch (error) {
            next(error);
        }
    }
}
exports.ExpensesController = ExpensesController;
exports.expensesController = new ExpensesController();
//# sourceMappingURL=expenses.controller.js.map