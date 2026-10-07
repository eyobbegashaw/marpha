import { db } from '../../database/connection';

export class AuditLogsService {
  async listLogs(
    organizationId: string,
    filters: {
      userId?: string;
      action?: string;
      entityName?: string;
      startDate?: string;
      endDate?: string;
      limit?: number;
      offset?: number;
    }
  ) {
    let query = `
      SELECT al.*,
             u.first_name || ' ' || u.last_name AS user_name,
             u.email AS user_email,
             r.name AS user_role
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE al.organization_id = $1
    `;
    const params: any[] = [organizationId];

    if (filters.userId) {
      params.push(filters.userId);
      query += ` AND al.user_id = $${params.length}`;
    }

    if (filters.action) {
      params.push(filters.action);
      query += ` AND al.action = $${params.length}`;
    }

    if (filters.entityName) {
      params.push(filters.entityName);
      query += ` AND al.entity_name = $${params.length}`;
    }

    if (filters.startDate) {
      params.push(filters.startDate);
      query += ` AND al.created_at >= $${params.length}`;
    }

    if (filters.endDate) {
      params.push(filters.endDate);
      query += ` AND al.created_at <= $${params.length}`;
    }

    query += ` ORDER BY al.created_at DESC`;

    if (filters.limit) {
      params.push(filters.limit);
      query += ` LIMIT $${params.length}`;
    }

    if (filters.offset) {
      params.push(filters.offset);
      query += ` OFFSET $${params.length}`;
    }

    const res = await db.query(query, params);
    return res.rows;
  }
}

export const auditLogsService = new AuditLogsService();
