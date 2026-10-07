import { db } from '../../database/connection';
import { BadRequestError, NotFoundError } from '../../common/errors';

export class ExpensesService {
  async listExpenses(organizationId: string, branchId?: string, startDate?: string, endDate?: string, isVoided?: boolean) {
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
    const params: any[] = [organizationId];

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
    const res = await db.query(query, params);
    return res.rows;
  }

  async getExpenseById(organizationId: string, expenseId: string) {
    const res = await db.query(
      `SELECT e.*, b.name AS branch_name,
              u.first_name || ' ' || u.last_name AS recorded_by_name,
              vu.first_name || ' ' || vu.last_name AS voided_by_name
       FROM expenses e
       JOIN branches b ON e.branch_id = b.id
       JOIN users u ON e.recorded_by = u.id
       LEFT JOIN users vu ON e.voided_by = vu.id
       WHERE e.organization_id = $1 AND e.id = $2`,
      [organizationId, expenseId]
    );

    if (res.rows.length === 0) throw new NotFoundError('Expense record not found');
    return res.rows[0];
  }

  async createExpense(organizationId: string, userId: string, data: any) {
    const res = await db.query(
      `INSERT INTO expenses (organization_id, branch_id, expense_category, description, amount, expense_date, recorded_by)
       VALUES ($1, $2, $3, $4, $5, COALESCE($6, CURRENT_DATE), $7)
       RETURNING *`,
      [organizationId, data.branchId, data.expenseCategory, data.description, data.amount, data.expenseDate || null, userId]
    );
    return res.rows[0];
  }

  async updateExpense(organizationId: string, expenseId: string, data: any) {
    const checkRes = await db.query(
      'SELECT is_voided FROM expenses WHERE organization_id = $1 AND id = $2',
      [organizationId, expenseId]
    );
    if (checkRes.rows.length === 0) throw new NotFoundError('Expense record not found');
    if (checkRes.rows[0].is_voided) throw new BadRequestError('Cannot edit a voided expense record');

    const res = await db.query(
      `UPDATE expenses
       SET branch_id = COALESCE($1, branch_id),
           expense_category = COALESCE($2, expense_category),
           description = COALESCE($3, description),
           amount = COALESCE($4, amount),
           expense_date = COALESCE($5, expense_date),
           updated_at = CURRENT_TIMESTAMP
       WHERE organization_id = $6 AND id = $7
       RETURNING *`,
      [data.branchId, data.expenseCategory, data.description, data.amount, data.expenseDate, organizationId, expenseId]
    );

    return res.rows[0];
  }

  async voidExpense(organizationId: string, expenseId: string, userId: string, reason: string) {
    const res = await db.query(
      `UPDATE expenses
       SET is_voided = TRUE, void_reason = $1, voided_by = $2, voided_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE organization_id = $3 AND id = $4 AND is_voided = FALSE
       RETURNING *`,
      [reason, userId, organizationId, expenseId]
    );

    if (res.rows.length === 0) {
      throw new BadRequestError('Expense record not found or already voided');
    }

    return res.rows[0];
  }
}

export const expensesService = new ExpensesService();
