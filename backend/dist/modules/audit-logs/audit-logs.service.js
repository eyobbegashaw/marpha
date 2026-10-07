"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditLogsService = exports.AuditLogsService = void 0;
const connection_1 = require("../../database/connection");
class AuditLogsService {
    async listLogs(organizationId, filters) {
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
        const params = [organizationId];
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
        const res = await connection_1.db.query(query, params);
        return res.rows;
    }
}
exports.AuditLogsService = AuditLogsService;
exports.auditLogsService = new AuditLogsService();
//# sourceMappingURL=audit-logs.service.js.map