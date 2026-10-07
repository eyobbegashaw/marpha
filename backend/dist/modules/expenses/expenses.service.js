"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expensesService = exports.ExpensesService = void 0;
const connection_1 = require("../../database/connection");
const errors_1 = require("../../common/errors");
class ExpensesService {
    async listExpenses(organizationId, branchId, startDate, endDate, isVoided) {
        let query = `
      SELECT e.*, b.name AS branch_name,
             u.first_name || ' ' || u.last_name AS recorded_by_name,
             vu.first_name || ' ' || vu.last_name AS voided_by_name
      FROM expenses e
      JOIN branches b ON e.branch_id = b.id
      JOIN users u ON e.recorded_by = u.id
      LEFT JOIN users vu ON e.voided_by = vu.id
      WHERE e.organization_id = $1
    `;
        const params = [organizationId];
        if (branchId) {
            params.push(branchId);
            query += ` AND e.branch_id = $${params.length}`;
        }
        if (startDate) {
            params.push(startDate);
            query += ` AND e.expense_date >= $${params.length}`;
        }
        if (endDate) {
            params.push(endDate);
            query += ` AND e.expense_date <= $${params.length}`;
        }
        if (isVoided !== undefined) {
            params.push(isVoided);
            query += ` AND e.is_voided = $${params.length}`;
        }
        query += ` ORDER BY e.expense_date DESC, e.created_at DESC`;
        const res = await connection_1.db.query(query, params);
        return res.rows;
    }
    async getExpenseById(organizationId, expenseId) {
        const res = await connection_1.db.query(`SELECT e.*, b.name AS branch_name,
              u.first_name || ' ' || u.last_name AS recorded_by_name,
              vu.first_name || ' ' || vu.last_name AS voided_by_name
       FROM expenses e
       JOIN branches b ON e.branch_id = b.id
       JOIN users u ON e.recorded_by = u.id
       LEFT JOIN users vu ON e.voided_by = vu.id
       WHERE e.organization_id = $1 AND e.id = $2`, [organizationId, expenseId]);
        if (res.rows.length === 0)
            throw new errors_1.NotFoundError('Expense record not found');
        return res.rows[0];
    }
    async createExpense(organizationId, userId, data) {
        const res = await connection_1.db.query(`INSERT INTO expenses (organization_id, branch_id, expense_category, description, amount, expense_date, recorded_by)
       VALUES ($1, $2, $3, $4, $5, COALESCE($6, CURRENT_DATE), $7)
       RETURNING *`, [organizationId, data.branchId, data.expenseCategory, data.description, data.amount, data.expenseDate || null, userId]);
        return res.rows[0];
    }
    async updateExpense(organizationId, expenseId, data) {
        const checkRes = await connection_1.db.query('SELECT is_voided FROM expenses WHERE organization_id = $1 AND id = $2', [organizationId, expenseId]);
        if (checkRes.rows.length === 0)
            throw new errors_1.NotFoundError('Expense record not found');
        if (checkRes.rows[0].is_voided)
            throw new errors_1.BadRequestError('Cannot edit a voided expense record');
        const res = await connection_1.db.query(`UPDATE expenses
       SET branch_id = COALESCE($1, branch_id),
           expense_category = COALESCE($2, expense_category),
           description = COALESCE($3, description),
           amount = COALESCE($4, amount),
           expense_date = COALESCE($5, expense_date),
           updated_at = CURRENT_TIMESTAMP
       WHERE organization_id = $6 AND id = $7
       RETURNING *`, [data.branchId, data.expenseCategory, data.description, data.amount, data.expenseDate, organizationId, expenseId]);
        return res.rows[0];
    }
    async voidExpense(organizationId, expenseId, userId, reason) {
        const res = await connection_1.db.query(`UPDATE expenses
       SET is_voided = TRUE, void_reason = $1, voided_by = $2, voided_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE organization_id = $3 AND id = $4 AND is_voided = FALSE
       RETURNING *`, [reason, userId, organizationId, expenseId]);
        if (res.rows.length === 0) {
            throw new errors_1.BadRequestError('Expense record not found or already voided');
        }
        return res.rows[0];
    }
}
exports.ExpensesService = ExpensesService;
exports.expensesService = new ExpensesService();
//# sourceMappingURL=expenses.service.js.map