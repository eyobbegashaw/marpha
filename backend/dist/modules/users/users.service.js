"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usersService = exports.UsersService = void 0;
const connection_1 = require("../../database/connection");
const hashHelper_1 = require("../../common/utils/hashHelper");
const errors_1 = require("../../common/errors");
class UsersService {
    async listUsers(organizationId, branchId, roleName) {
        let query = `
      SELECT u.id, u.organization_id, u.branch_id, u.role_id, r.name AS role,
             u.first_name, u.last_name, u.email, u.phone, u.language_preference,
             u.is_active, u.created_at, u.last_login_at,
             b.name AS branch_name
      FROM users u
      JOIN roles r ON u.role_id = r.id
      LEFT JOIN branches b ON u.branch_id = b.id
      WHERE u.organization_id = $1
    `;
        const params = [organizationId];
        if (branchId) {
            params.push(branchId);
            query += ` AND u.branch_id = $${params.length}`;
        }
        if (roleName) {
            params.push(roleName);
            query += ` AND r.name = $${params.length}`;
        }
        query += ` ORDER BY u.created_at DESC`;
        const res = await connection_1.db.query(query, params);
        return res.rows;
    }
    async getUserById(organizationId, userId) {
        const res = await connection_1.db.query(`SELECT u.id, u.organization_id, u.branch_id, u.role_id, r.name AS role,
              u.first_name, u.last_name, u.email, u.phone, u.language_preference,
              u.is_active, u.created_at, u.last_login_at,
              b.name AS branch_name
       FROM users u
       JOIN roles r ON u.role_id = r.id
       LEFT JOIN branches b ON u.branch_id = b.id
       WHERE u.organization_id = $1 AND u.id = $2`, [organizationId, userId]);
        if (res.rows.length === 0) {
            throw new errors_1.NotFoundError('User not found');
        }
        return res.rows[0];
    }
    async createUser(organizationId, data) {
        // Check email uniqueness
        const existing = await connection_1.db.query('SELECT id FROM users WHERE email = $1', [data.email.toLowerCase()]);
        if (existing.rows.length > 0) {
            throw new errors_1.ConflictError('A user with this email address already exists');
        }
        // Find role
        let roleRes = await connection_1.db.query('SELECT id FROM roles WHERE name = $1', [data.roleName]);
        let roleId;
        if (roleRes.rows.length === 0) {
            const newRole = await connection_1.db.query('INSERT INTO roles (name, description, is_system) VALUES ($1, $2, TRUE) RETURNING id', [data.roleName, `${data.roleName} role`]);
            roleId = newRole.rows[0].id;
        }
        else {
            roleId = roleRes.rows[0].id;
        }
        const hashed = await hashHelper_1.hashHelper.hash(data.password);
        const res = await connection_1.db.query(`INSERT INTO users (organization_id, branch_id, role_id, first_name, last_name, email, phone, password_hash, language_preference, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, TRUE)
       RETURNING id, organization_id, branch_id, role_id, first_name, last_name, email, phone, language_preference, is_active, created_at`, [
            organizationId,
            data.branchId || null,
            roleId,
            data.firstName,
            data.lastName,
            data.email.toLowerCase(),
            data.phone || null,
            hashed,
            data.languagePreference,
        ]);
        return {
            ...res.rows[0],
            role: data.roleName,
        };
    }
    async updateUser(organizationId, userId, data) {
        let roleId = undefined;
        if (data.roleName) {
            const roleRes = await connection_1.db.query('SELECT id FROM roles WHERE name = $1', [data.roleName]);
            if (roleRes.rows.length === 0) {
                throw new errors_1.BadRequestError(`Role ${data.roleName} does not exist`);
            }
            roleId = roleRes.rows[0].id;
        }
        const res = await connection_1.db.query(`UPDATE users
       SET branch_id = COALESCE($1, branch_id),
           role_id = COALESCE($2, role_id),
           first_name = COALESCE($3, first_name),
           last_name = COALESCE($4, last_name),
           phone = COALESCE($5, phone),
           is_active = COALESCE($6, is_active),
           language_preference = COALESCE($7, language_preference),
           updated_at = CURRENT_TIMESTAMP
       WHERE organization_id = $8 AND id = $9
       RETURNING id, organization_id, branch_id, role_id, first_name, last_name, email, phone, language_preference, is_active, updated_at`, [
            data.branchId,
            roleId,
            data.firstName,
            data.lastName,
            data.phone,
            data.isActive,
            data.languagePreference,
            organizationId,
            userId,
        ]);
        if (res.rows.length === 0) {
            throw new errors_1.NotFoundError('User not found');
        }
        return res.rows[0];
    }
    async setUserStatus(organizationId, userId, isActive) {
        const res = await connection_1.db.query(`UPDATE users
       SET is_active = $1, updated_at = CURRENT_TIMESTAMP
       WHERE organization_id = $2 AND id = $3
       RETURNING id, email, first_name, last_name, is_active`, [isActive, organizationId, userId]);
        if (res.rows.length === 0) {
            throw new errors_1.NotFoundError('User not found');
        }
        return res.rows[0];
    }
}
exports.UsersService = UsersService;
exports.usersService = new UsersService();
//# sourceMappingURL=users.service.js.map