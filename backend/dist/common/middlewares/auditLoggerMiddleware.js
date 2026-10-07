"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logAuditEvent = void 0;
const connection_1 = require("../../database/connection");
const logAuditEvent = async (req, action, entityName, entityId, details) => {
    try {
        const orgId = req.user?.organization_id || null;
        const branchId = req.user?.branch_id || null;
        const userId = req.user?.id || null;
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || null;
        const userAgent = req.headers['user-agent'] || null;
        await connection_1.db.query(`INSERT INTO audit_logs (organization_id, branch_id, user_id, action, entity_name, entity_id, ip_address, user_agent, details)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`, [orgId, branchId, userId, action, entityName, entityId, ip, userAgent, details ? JSON.stringify(details) : null]);
    }
    catch (err) {
        console.error('Failed to write audit log:', err);
    }
};
exports.logAuditEvent = logAuditEvent;
//# sourceMappingURL=auditLoggerMiddleware.js.map