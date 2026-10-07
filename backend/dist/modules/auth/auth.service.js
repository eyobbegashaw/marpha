"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = exports.AuthService = void 0;
const connection_1 = require("../../database/connection");
const hashHelper_1 = require("../../common/utils/hashHelper");
const tokenHelper_1 = require("../../common/utils/tokenHelper");
const errors_1 = require("../../common/errors");
class AuthService {
    async registerOwner(data) {
        // Check if email already exists
        const existing = await connection_1.db.query('SELECT id FROM users WHERE email = $1', [data.email.toLowerCase()]);
        if (existing.rows.length > 0) {
            throw new errors_1.ConflictError('A user with this email address already exists');
        }
        return await connection_1.db.withTransaction(async (client) => {
            // 1. Create Organization
            const orgRes = await client.query(`INSERT INTO organizations (name, code)
         VALUES ($1, $2)
         RETURNING id, name, code`, [data.organizationName, data.organizationCode.toUpperCase()]);
            const org = orgRes.rows[0];
            // 2. Create Main Branch
            const branchRes = await client.query(`INSERT INTO branches (organization_id, name, code, is_main)
         VALUES ($1, $2, $3, TRUE)
         RETURNING id, name, code`, [org.id, data.branchName, data.branchCode.toUpperCase()]);
            const branch = branchRes.rows[0];
            // 3. Create Default Locations: Sales Shelf and Main Warehouse
            await client.query(`INSERT INTO locations (organization_id, branch_id, name, code, location_type, is_sales_point, description)
         VALUES
         ($1, $2, 'Main Sales Shelf', 'SHELF-01', 'SALES_SHELF', TRUE, 'Front counter customer-facing sales shelf'),
         ($1, $2, 'Main Warehouse', 'WH-01', 'WAREHOUSE', FALSE, 'Back storage central reserve warehouse')`, [org.id, branch.id]);
            // 4. Ensure PHARMACY_OWNER role exists
            let roleRes = await client.query(`SELECT id FROM roles WHERE name = 'PHARMACY_OWNER'`);
            let roleId;
            if (roleRes.rows.length === 0) {
                const newRole = await client.query(`INSERT INTO roles (name, description, is_system) VALUES ('PHARMACY_OWNER', 'Pharmacy Owner with full management access', TRUE) RETURNING id`);
                roleId = newRole.rows[0].id;
            }
            else {
                roleId = roleRes.rows[0].id;
            }
            // 5. Hash password and create user
            const hashedPassword = await hashHelper_1.hashHelper.hash(data.password);
            const userRes = await client.query(`INSERT INTO users (organization_id, branch_id, role_id, first_name, last_name, email, phone, password_hash, language_preference)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id, organization_id, branch_id, role_id, first_name, last_name, email, phone, language_preference, created_at`, [
                org.id,
                branch.id,
                roleId,
                data.firstName,
                data.lastName,
                data.email.toLowerCase(),
                data.phone || null,
                hashedPassword,
                data.languagePreference,
            ]);
            const user = userRes.rows[0];
            const token = tokenHelper_1.tokenHelper.generateToken({
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
    async login(email, pass) {
        const res = await connection_1.db.query(`SELECT u.id, u.organization_id, u.branch_id, u.role_id, r.name AS role,
              u.first_name, u.last_name, u.email, u.phone, u.password_hash,
              u.language_preference, u.is_active,
              o.name as organization_name, b.name as branch_name
       FROM users u
       JOIN roles r ON u.role_id = r.id
       LEFT JOIN organizations o ON u.organization_id = o.id
       LEFT JOIN branches b ON u.branch_id = b.id
       WHERE u.email = $1`, [email.toLowerCase()]);
        if (res.rows.length === 0) {
            throw new errors_1.UnauthorizedError('Invalid email or password');
        }
        const user = res.rows[0];
        if (!user.is_active) {
            throw new errors_1.UnauthorizedError('Account has been deactivated. Please contact your administrator.');
        }
        const isValid = await hashHelper_1.hashHelper.compare(pass, user.password_hash);
        if (!isValid) {
            throw new errors_1.UnauthorizedError('Invalid email or password');
        }
        // Update last login
        await connection_1.db.query('UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);
        const token = tokenHelper_1.tokenHelper.generateToken({
            userId: user.id,
            organizationId: user.organization_id,
            branchId: user.branch_id,
            role: user.role,
        });
        const { password_hash, ...userProfile } = user;
        return {
            user: userProfile,
            token,
        };
    }
    async getProfile(userId) {
        const res = await connection_1.db.query(`SELECT u.id, u.organization_id, u.branch_id, u.role_id, r.name AS role,
              u.first_name, u.last_name, u.email, u.phone, u.language_preference,
              u.is_active, u.created_at, u.last_login_at,
              o.name as organization_name, b.name as branch_name
       FROM users u
       JOIN roles r ON u.role_id = r.id
       LEFT JOIN organizations o ON u.organization_id = o.id
       LEFT JOIN branches b ON u.branch_id = b.id
       WHERE u.id = $1`, [userId]);
        if (res.rows.length === 0) {
            throw new errors_1.NotFoundError('User not found');
        }
        // Fetch permissions
        const permRes = await connection_1.db.query(`SELECT p.code FROM role_permissions rp
       JOIN permissions p ON rp.permission_id = p.id
       WHERE rp.role_id = $1`, [res.rows[0].role_id]);
        return {
            ...res.rows[0],
            permissions: permRes.rows.map((p) => p.code),
        };
    }
    async changePassword(userId, currentPass, newPass) {
        const res = await connection_1.db.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
        if (res.rows.length === 0) {
            throw new errors_1.NotFoundError('User not found');
        }
        const valid = await hashHelper_1.hashHelper.compare(currentPass, res.rows[0].password_hash);
        if (!valid) {
            throw new errors_1.BadRequestError('Current password is incorrect');
        }
        const newHash = await hashHelper_1.hashHelper.hash(newPass);
        await connection_1.db.query('UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [newHash, userId]);
        return { message: 'Password updated successfully' };
    }
    async updateLanguage(userId, language) {
        await connection_1.db.query('UPDATE users SET language_preference = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [language, userId]);
        return { language, message: 'Language preference updated successfully' };
    }
}
exports.AuthService = AuthService;
exports.authService = new AuthService();
//# sourceMappingURL=auth.service.js.map