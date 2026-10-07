import { db } from '../../database/connection';
import { hashHelper } from '../../common/utils/hashHelper';
import { tokenHelper } from '../../common/utils/tokenHelper';
import { BadRequestError, UnauthorizedError, ConflictError, NotFoundError } from '../../common/errors';
import { notificationsService } from '../notifications/notifications.service';

export class AuthService {
  async registerOwner(data: {
    organizationName: string;
    organizationCode: string;
    branchName: string;
    branchCode: string;
    username?: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    password: string;
    languagePreference: 'en' | 'am';
  }) {
    // Check if email or username already exists
    const existingEmail = await db.query('SELECT id FROM users WHERE email = $1', [data.email.toLowerCase()]);
    if (existingEmail.rows.length > 0) {
      throw new ConflictError('A user with this email address already exists');
    }

    const username = (data.username?.trim() || data.email.split('@')[0] || 'owner').toLowerCase();
    const existingUser = await db.query('SELECT id FROM users WHERE username = $1', [username]);
    if (existingUser.rows.length > 0) {
      throw new ConflictError('A user with this username already exists');
    }

    return await db.withTransaction(async (client) => {
      // 1. Create Organization
      const orgRes = await client.query(
        `INSERT INTO organizations (name, code)
         VALUES ($1, $2)
         RETURNING id, name, code`,
        [data.organizationName, data.organizationCode.toUpperCase()]
      );
      const org = orgRes.rows[0];

      // 2. Create Main Branch
      const branchRes = await client.query(
        `INSERT INTO branches (organization_id, name, code, is_main)
         VALUES ($1, $2, $3, TRUE)
         RETURNING id, name, code`,
        [org.id, data.branchName, data.branchCode.toUpperCase()]
      );
      const branch = branchRes.rows[0];

      // 3. Create Default Locations: Sales Shelf and Main Warehouse
      await client.query(
        `INSERT INTO locations (organization_id, branch_id, name, code, location_type, is_sales_point, description)
         VALUES
         ($1, $2, 'Main Sales Shelf', 'SHELF-01', 'SALES_SHELF', TRUE, 'Front counter customer-facing sales shelf'),
         ($1, $2, 'Main Warehouse', 'WH-01', 'WAREHOUSE', FALSE, 'Back storage central reserve warehouse')`,
        [org.id, branch.id]
      );

      // 4. Ensure PHARMACY_OWNER role exists
      let roleRes = await client.query(`SELECT id FROM roles WHERE name = 'PHARMACY_OWNER'`);
      let roleId: string;
      if (roleRes.rows.length === 0) {
        const newRole = await client.query(
          `INSERT INTO roles (name, description, is_system) VALUES ('PHARMACY_OWNER', 'Pharmacy Owner with full management access', TRUE) RETURNING id`
        );
        roleId = newRole.rows[0].id;
      } else {
        roleId = roleRes.rows[0].id;
      }

      // 5. Hash password and create user
      const hashedPassword = await hashHelper.hash(data.password);
      const userRes = await client.query(
        `INSERT INTO users (organization_id, branch_id, role_id, username, first_name, last_name, email, phone, password_hash, language_preference, must_change_password)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, FALSE)
         RETURNING id, organization_id, branch_id, role_id, username, first_name, last_name, email, phone, language_preference, must_change_password, created_at`,
        [
          org.id,
          branch.id,
          roleId,
          username,
          data.firstName,
          data.lastName,
          data.email.toLowerCase(),
          data.phone || null,
          hashedPassword,
          data.languagePreference,
        ]
      );
      const user = userRes.rows[0];

      const token = tokenHelper.generateToken({
        userId: user.id,
        organizationId: org.id,
        branchId: branch.id,
        role: 'PHARMACY_OWNER',
      });

      return {
        user: {
          ...user,
          role: 'PHARMACY_OWNER',
        },
        organization: org,
        branch,
        token,
      };
    });
  }

  async login(identifier: string, pass: string, tenantCodeOrSlug?: string) {
    const cleanId = identifier.trim().toLowerCase();
    const res = await db.query(
      `SELECT u.id, u.organization_id, u.branch_id, u.role_id, r.name AS role,
              u.username, u.first_name, u.last_name, u.email, u.phone, u.password_hash,
              u.language_preference, u.is_active, u.must_change_password,
              o.name as organization_name, o.code as organization_code, b.name as branch_name
       FROM users u
       JOIN roles r ON u.role_id = r.id
       LEFT JOIN organizations o ON u.organization_id = o.id
       LEFT JOIN branches b ON u.branch_id = b.id
       WHERE LOWER(u.email) = $1 OR LOWER(u.username) = $1`,
      [cleanId]
    );

    if (res.rows.length === 0) {
      throw new UnauthorizedError('Invalid username/email or password');
    }

    const user = res.rows[0];

    if (!user.is_active) {
      throw new UnauthorizedError('Account has been deactivated. Please contact your administrator.');
    }

    const isValid = await hashHelper.compare(pass, user.password_hash);
    if (!isValid) {
      throw new UnauthorizedError('Invalid username/email or password');
    }

    // Update last login
    await db.query('UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);

    const token = tokenHelper.generateToken({
      userId: user.id,
      organizationId: user.organization_id,
      branchId: user.branch_id,
      role: user.role,
    });

    const { password_hash, ...userProfile } = user;

    return {
      user: {
        ...userProfile,
        must_change_password: Boolean(user.must_change_password),
      },
      token,
    };
  }

  async firstLoginChangePassword(userId: string, newPass: string) {
    const res = await db.query(
      `SELECT u.id, u.organization_id, u.branch_id, u.role_id, r.name AS role,
              u.username, u.first_name, u.last_name, u.email, u.phone,
              u.language_preference, u.is_active
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.id = $1`,
      [userId]
    );

    if (res.rows.length === 0) {
      throw new NotFoundError('User not found');
    }

    const newHash = await hashHelper.hash(newPass);
    await db.query(
      `UPDATE users
       SET password_hash = $1, must_change_password = FALSE, reset_token = NULL, reset_token_expires_at = NULL, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [newHash, userId]
    );

    const user = res.rows[0];
    const token = tokenHelper.generateToken({
      userId: user.id,
      organizationId: user.organization_id,
      branchId: user.branch_id,
      role: user.role,
    });

    return {
      user: {
        ...user,
        must_change_password: false,
      },
      token,
      message: 'Password updated successfully. You can now access your dashboard.',
    };
  }

  async requestForgotPassword(identifier: string, tenantCodeOrSlug?: string) {
    const cleanId = identifier.trim().toLowerCase();
    const userRes = await db.query(
      `SELECT u.id, u.organization_id, u.username, u.first_name, u.last_name, u.email, u.role_id, r.name AS role
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE LOWER(u.email) = $1 OR LOWER(u.username) = $1`,
      [cleanId]
    );

    if (userRes.rows.length === 0) {
      throw new NotFoundError('No user account found with this username or email.');
    }

    const user = userRes.rows[0];

    // Check tenant config for password_reset_strategy
    let strategy = 'OWNER_RESET';
    if (user.organization_id) {
      const configRes = await db.query(
        `SELECT settings, feature_flags FROM tenant_configurations WHERE organization_id = $1`,
        [user.organization_id]
      );
      if (configRes.rows.length > 0) {
        strategy = configRes.rows[0].settings?.password_reset_strategy || 'OWNER_RESET';
      }
    }

    if (strategy === 'EMAIL_RESET') {
      // Option B: Self-service email reset code
      const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
      await db.query(
        `UPDATE users
         SET reset_token = $1, reset_token_expires_at = CURRENT_TIMESTAMP + INTERVAL '15 minutes'
         WHERE id = $2`,
        [resetCode, user.id]
      );

      // Record request
      await db.query(
        `INSERT INTO password_reset_requests (organization_id, user_id, username, email, strategy, status, reset_code, expires_at)
         VALUES ($1, $2, $3, $4, 'EMAIL_RESET', 'PENDING', $5, CURRENT_TIMESTAMP + INTERVAL '15 minutes')`,
        [user.organization_id, user.id, user.username || user.email, user.email, resetCode]
      );

      return {
        strategy: 'EMAIL_RESET',
        email: user.email,
        resetCode, // provided for preview/testing environments
        message: `A 6-digit password reset code has been sent to ${user.email}. Please check your email and enter the code to set your new password.`,
      };
    } else {
      // Option A: Owner approval & manual reset request
      await db.query(
        `INSERT INTO password_reset_requests (organization_id, user_id, username, email, strategy, status)
         VALUES ($1, $2, $3, $4, 'OWNER_RESET', 'PENDING')`,
        [user.organization_id, user.id, user.username || user.email, user.email]
      );

      // Create high-priority notification for Pharmacy Owner
      if (user.organization_id) {
        await notificationsService.createNotification({
          organizationId: user.organization_id,
          targetRole: 'PHARMACY_OWNER',
          type: 'PASSWORD_RESET_REQUEST',
          severity: 'HIGH',
          title_en: '🔑 Password Reset Request',
          title_am: '🔑 የይለፍ ቃል መቀየሪያ ጥያቄ',
          message_en: `Pharmacist ${user.first_name} ${user.last_name} (@${user.username || user.email}) has requested a password reset. You can approve and issue a temporary password from Staff Management.`,
          message_am: `ፋርማሲስት ${user.first_name} ${user.last_name} (@${user.username || user.email}) የይለፍ ቃል መቀየር ጠይቋል። እባክዎ ከሰራተኞች ማስተዳደሪያ ገጽ ላይ አዲስ የይለፍ ቃል ይስጡ።`,
          metadata: { userId: user.id, username: user.username, email: user.email },
        });
      }

      return {
        strategy: 'OWNER_RESET',
        message: 'Password reset request submitted to your Pharmacy Owner. Please ask your Pharmacy Owner to approve and provide your new default password.',
      };
    }
  }

  async verifyAndResetPassword(identifier: string, resetCode: string, newPass: string) {
    const cleanId = identifier.trim().toLowerCase();
    const userRes = await db.query(
      `SELECT id, organization_id, reset_token, reset_token_expires_at
       FROM users
       WHERE (LOWER(email) = $1 OR LOWER(username) = $1)`,
      [cleanId]
    );

    if (userRes.rows.length === 0) {
      throw new NotFoundError('User account not found.');
    }

    const user = userRes.rows[0];

    if (!user.reset_token || user.reset_token !== resetCode.trim()) {
      throw new BadRequestError('Invalid reset verification code.');
    }

    if (new Date(user.reset_token_expires_at) < new Date()) {
      throw new BadRequestError('Reset verification code has expired. Please request a new code.');
    }

    const newHash = await hashHelper.hash(newPass);
    await db.query(
      `UPDATE users
       SET password_hash = $1, reset_token = NULL, reset_token_expires_at = NULL, must_change_password = FALSE, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [newHash, user.id]
    );

    // Mark reset requests as completed
    await db.query(
      `UPDATE password_reset_requests
       SET status = 'COMPLETED', resolved_at = CURRENT_TIMESTAMP
       WHERE user_id = $1 AND status = 'PENDING'`,
      [user.id]
    );

    return {
      message: 'Password reset successfully. You can now log in with your new password.',
    };
  }

  async ownerResetPharmacistPassword(organizationId: string, ownerUserId: string, targetUserId: string, customNewPassword?: string) {
    const userRes = await db.query(
      `SELECT id, first_name, last_name, email, username
       FROM users
       WHERE id = $1 AND organization_id = $2`,
      [targetUserId, organizationId]
    );

    if (userRes.rows.length === 0) {
      throw new NotFoundError('Pharmacist not found in this pharmacy.');
    }

    const targetUser = userRes.rows[0];
    const defaultPassword = customNewPassword || 'SelamDefault123!';
    const hashed = await hashHelper.hash(defaultPassword);

    await db.query(
      `UPDATE users
       SET password_hash = $1, must_change_password = TRUE, reset_token = NULL, reset_token_expires_at = NULL, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [hashed, targetUserId]
    );

    // Resolve pending password reset requests
    await db.query(
      `UPDATE password_reset_requests
       SET status = 'APPROVED', resolved_at = CURRENT_TIMESTAMP, resolved_by = $1, temp_password = $2
       WHERE user_id = $3 AND status = 'PENDING'`,
      [ownerUserId, defaultPassword, targetUserId]
    );

    return {
      message: `Password for ${targetUser.first_name} ${targetUser.last_name} has been reset to "${defaultPassword}". The pharmacist will be forced to create their own password upon logging in.`,
      defaultPassword,
      pharmacistUsername: targetUser.username,
      pharmacistEmail: targetUser.email,
    };
  }

  async listPasswordResetRequests(organizationId: string) {
    const res = await db.query(
      `SELECT pr.*, u.first_name, u.last_name, u.phone
       FROM password_reset_requests pr
       JOIN users u ON pr.user_id = u.id
       WHERE pr.organization_id = $1
       ORDER BY pr.requested_at DESC LIMIT 50`,
      [organizationId]
    );
    return res.rows;
  }

  async getProfile(userId: string) {
    const res = await db.query(
      `SELECT u.id, u.organization_id, u.branch_id, u.role_id, r.name AS role,
              u.username, u.first_name, u.last_name, u.email, u.phone, u.language_preference,
              u.is_active, u.must_change_password, u.created_at, u.last_login_at,
              o.name as organization_name, b.name as branch_name
       FROM users u
       JOIN roles r ON u.role_id = r.id
       LEFT JOIN organizations o ON u.organization_id = o.id
       LEFT JOIN branches b ON u.branch_id = b.id
       WHERE u.id = $1`,
      [userId]
    );

    if (res.rows.length === 0) {
      throw new NotFoundError('User not found');
    }

    // Fetch permissions
    const permRes = await db.query(
      `SELECT p.code FROM role_permissions rp
       JOIN permissions p ON rp.permission_id = p.id
       WHERE rp.role_id = $1`,
      [res.rows[0].role_id]
    );

    return {
      ...res.rows[0],
      permissions: permRes.rows.map((p) => p.code),
    };
  }

  async changePassword(userId: string, currentPass: string, newPass: string) {
    const res = await db.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
    if (res.rows.length === 0) {
      throw new NotFoundError('User not found');
    }

    const valid = await hashHelper.compare(currentPass, res.rows[0].password_hash);
    if (!valid) {
      throw new BadRequestError('Current password is incorrect');
    }

    const newHash = await hashHelper.hash(newPass);
    await db.query(
      'UPDATE users SET password_hash = $1, must_change_password = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newHash, userId]
    );

    return { message: 'Password updated successfully' };
  }

  async updateLanguage(userId: string, language: 'en' | 'am') {
    await db.query('UPDATE users SET language_preference = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [language, userId]);
    return { language, message: 'Language preference updated successfully' };
  }
}

export const authService = new AuthService();
