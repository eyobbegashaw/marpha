import { db } from '../../database/connection';
import { hashHelper } from '../../common/utils/hashHelper';
import { ConflictError, NotFoundError, BadRequestError } from '../../common/errors';

export class UsersService {
  async listUsers(organizationId: string, branchId?: string, roleName?: string) {
    let query = `
      SELECT u.id, u.organization_id, u.branch_id, u.role_id, r.name AS role,
             u.username, u.first_name, u.last_name, u.email, u.phone, u.language_preference,
             u.is_active, u.must_change_password, u.created_at, u.last_login_at,
             b.name AS branch_name
      FROM users u
      JOIN roles r ON u.role_id = r.id
      LEFT JOIN branches b ON u.branch_id = b.id
      WHERE u.organization_id = $1
    `;
    const params: any[] = [organizationId];

    if (branchId) {
      params.push(branchId);
      query += ` AND u.branch_id = $${params.length}`;
    }

    if (roleName) {
      params.push(roleName);
      query += ` AND r.name = $${params.length}`;
    }

    query += ` ORDER BY u.created_at DESC`;
    const res = await db.query(query, params);
    return res.rows;
  }

  async getUserById(organizationId: string, userId: string) {
    const res = await db.query(
      `SELECT u.id, u.organization_id, u.branch_id, u.role_id, r.name AS role,
              u.username, u.first_name, u.last_name, u.email, u.phone, u.language_preference,
              u.is_active, u.must_change_password, u.created_at, u.last_login_at,
              b.name AS branch_name
       FROM users u
       JOIN roles r ON u.role_id = r.id
       LEFT JOIN branches b ON u.branch_id = b.id
       WHERE u.organization_id = $1 AND u.id = $2`,
      [organizationId, userId]
    );

    if (res.rows.length === 0) {
      throw new NotFoundError('User not found');
    }

    return res.rows[0];
  }

  async createUser(organizationId: string, data: {
    branchId?: string;
    roleName?: string;
    role?: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    fullName?: string;
    email: string;
    phone?: string;
    password?: string;
    languagePreference?: 'en' | 'am';
  }) {
    // Check email uniqueness
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [data.email.toLowerCase()]);
    if (existing.rows.length > 0) {
      throw new ConflictError('A user with this email address already exists');
    }

    let firstName = data.firstName?.trim() || '';
    let lastName = data.lastName?.trim() || '';
    if ((!firstName || !lastName) && data.fullName) {
      const parts = data.fullName.trim().split(/\s+/);
      firstName = firstName || parts[0] || 'Staff';
      lastName = lastName || (parts.length > 1 ? parts.slice(1).join(' ') : 'Pharmacist');
    }
    if (!firstName) firstName = 'Staff';
    if (!lastName) lastName = 'Pharmacist';

    // Generate or sanitize username
    let username = (data.username?.trim() || '').toLowerCase().replace(/[^a-z0-9._-]/g, '');
    if (!username) {
      username = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`.replace(/[^a-z0-9._-]/g, '');
    }

    // Ensure username is unique within this organization
    const existingUser = await db.query(
      'SELECT id FROM users WHERE (organization_id = $1 OR organization_id IS NULL) AND LOWER(username) = $2',
      [organizationId, username]
    );
    if (existingUser.rows.length > 0) {
      username = `${username}_${Math.floor(100 + Math.random() * 900)}`;
    }

    const targetRole = data.roleName || data.role || 'PHARMACIST';

    // Find role
    let roleRes = await db.query('SELECT id FROM roles WHERE name = $1', [targetRole]);
    let roleId: string;
    if (roleRes.rows.length === 0) {
      const newRole = await db.query(
        'INSERT INTO roles (name, description, is_system) VALUES ($1, $2, TRUE) RETURNING id',
        [targetRole, `${targetRole} role`]
      );
      roleId = newRole.rows[0].id;
    } else {
      roleId = roleRes.rows[0].id;
    }

    // Default branch if not provided
    let branchId = data.branchId || null;
    if (!branchId) {
      const branchRes = await db.query('SELECT id FROM branches WHERE organization_id = $1 LIMIT 1', [organizationId]);
      if (branchRes.rows.length > 0) {
        branchId = branchRes.rows[0].id;
      }
    }

    const defaultPassword = data.password || 'SelamDefault123!';
    const hashed = await hashHelper.hash(defaultPassword);
    const res = await db.query(
      `INSERT INTO users (organization_id, branch_id, role_id, username, first_name, last_name, email, phone, password_hash, language_preference, is_active, must_change_password)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, TRUE, TRUE)
       RETURNING id, organization_id, branch_id, role_id, username, first_name, last_name, email, phone, language_preference, is_active, must_change_password, created_at`,
      [
        organizationId,
        branchId,
        roleId,
        username,
        firstName,
        lastName,
        data.email.toLowerCase(),
        data.phone || null,
        hashed,
        data.languagePreference || 'en',
      ]
    );

    return {
      ...res.rows[0],
      role: targetRole,
      defaultPassword,
    };
  }

  async updateUser(organizationId: string, userId: string, data: {
    branchId?: string;
    roleName?: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    isActive?: boolean;
    languagePreference?: 'en' | 'am';
  }) {
    let roleId: string | undefined = undefined;
    if (data.roleName) {
      const roleRes = await db.query('SELECT id FROM roles WHERE name = $1', [data.roleName]);
      if (roleRes.rows.length === 0) {
        throw new BadRequestError(`Role ${data.roleName} does not exist`);
      }
      roleId = roleRes.rows[0].id;
    }

    const res = await db.query(
      `UPDATE users
       SET branch_id = COALESCE($1, branch_id),
           role_id = COALESCE($2, role_id),
           username = COALESCE($3, username),
           first_name = COALESCE($4, first_name),
           last_name = COALESCE($5, last_name),
           phone = COALESCE($6, phone),
           is_active = COALESCE($7, is_active),
           language_preference = COALESCE($8, language_preference),
           updated_at = CURRENT_TIMESTAMP
       WHERE organization_id = $9 AND id = $10
       RETURNING id, organization_id, branch_id, role_id, username, first_name, last_name, email, phone, language_preference, is_active, must_change_password, updated_at`,
      [
        data.branchId,
        roleId,
        data.username,
        data.firstName,
        data.lastName,
        data.phone,
        data.isActive,
        data.languagePreference,
        organizationId,
        userId,
      ]
    );

    if (res.rows.length === 0) {
      throw new NotFoundError('User not found');
    }

    return res.rows[0];
  }

  async setUserStatus(organizationId: string, userId: string, isActive: boolean) {
    const res = await db.query(
      `UPDATE users
       SET is_active = $1, updated_at = CURRENT_TIMESTAMP
       WHERE organization_id = $2 AND id = $3
       RETURNING id, email, username, first_name, last_name, is_active`,
      [isActive, organizationId, userId]
    );

    if (res.rows.length === 0) {
      throw new NotFoundError('User not found');
    }

    return res.rows[0];
  }

  async resetUserPassword(organizationId: string, userId: string, newPassword?: string) {
    const defaultPassword = newPassword || 'SelamDefault123!';
    const hashed = await hashHelper.hash(defaultPassword);

    const res = await db.query(
      `UPDATE users
       SET password_hash = $1, must_change_password = TRUE, reset_token = NULL, reset_token_expires_at = NULL, updated_at = CURRENT_TIMESTAMP
       WHERE organization_id = $2 AND id = $3
       RETURNING id, email, username, first_name, last_name, must_change_password`,
      [hashed, organizationId, userId]
    );

    if (res.rows.length === 0) {
      throw new NotFoundError('User not found');
    }

    // Resolve any pending requests
    await db.query(
      `UPDATE password_reset_requests
       SET status = 'APPROVED', resolved_at = CURRENT_TIMESTAMP
       WHERE user_id = $1 AND status = 'PENDING'`,
      [userId]
    );

    return {
      user: res.rows[0],
      defaultPassword,
      message: `Password reset to "${defaultPassword}". Pharmacist must change this password on next login.`,
    };
  }
}

export const usersService = new UsersService();
