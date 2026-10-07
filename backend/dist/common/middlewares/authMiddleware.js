"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuthMiddleware = exports.authMiddleware = void 0;
const tokenHelper_1 = require("../utils/tokenHelper");
const connection_1 = require("../../database/connection");
const errors_1 = require("../errors");
const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new errors_1.UnauthorizedError('No authentication token provided');
        }
        const token = authHeader.split(' ')[1];
        let decoded;
        try {
            decoded = tokenHelper_1.tokenHelper.verifyToken(token);
        }
        catch (err) {
            throw new errors_1.UnauthorizedError('Invalid or expired authentication token');
        }
        // Fetch user details and permissions from database
        const userResult = await connection_1.db.query(`SELECT u.id, u.organization_id, u.branch_id, u.role_id, r.name AS role,
              u.email, u.first_name, u.last_name, u.language_preference, u.is_active
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.id = $1`, [decoded.userId]);
        if (userResult.rows.length === 0 || !userResult.rows[0].is_active) {
            throw new errors_1.UnauthorizedError('User account not found or inactive');
        }
        const userRow = userResult.rows[0];
        // Fetch permissions for this role
        const permResult = await connection_1.db.query(`SELECT p.code
       FROM role_permissions rp
       JOIN permissions p ON rp.permission_id = p.id
       WHERE rp.role_id = $1`, [userRow.role_id]);
        const permissions = permResult.rows.map((p) => p.code);
        const langHeader = req.headers['accept-language'];
        const requestedLang = (langHeader?.toLowerCase().includes('am') ? 'am' : (userRow.language_preference || 'en'));
        req.user = {
            id: userRow.id,
            organization_id: userRow.organization_id,
            branch_id: userRow.branch_id,
            role: userRow.role,
            role_id: userRow.role_id,
            email: userRow.email,
            first_name: userRow.first_name,
            last_name: userRow.last_name,
            language_preference: userRow.language_preference,
            permissions,
        };
        req.language = requestedLang;
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.authMiddleware = authMiddleware;
const optionalAuthMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            // Public / Customer unauthenticated access
            const langHeader = req.headers['accept-language'];
            req.language = langHeader?.toLowerCase().includes('am') ? 'am' : 'en';
            return next();
        }
        const token = authHeader.split(' ')[1];
        let decoded;
        try {
            decoded = tokenHelper_1.tokenHelper.verifyToken(token);
        }
        catch (err) {
            return next(); // Proceed without req.user for invalid optional token
        }
        const userResult = await connection_1.db.query(`SELECT u.id, u.organization_id, u.branch_id, u.role_id, r.name AS role,
              u.email, u.first_name, u.last_name, u.language_preference, u.is_active
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.id = $1`, [decoded.userId]);
        if (userResult.rows.length > 0 && userResult.rows[0].is_active) {
            const userRow = userResult.rows[0];
            const permResult = await connection_1.db.query(`SELECT p.code
         FROM role_permissions rp
         JOIN permissions p ON rp.permission_id = p.id
         WHERE rp.role_id = $1`, [userRow.role_id]);
            req.user = {
                id: userRow.id,
                organization_id: userRow.organization_id,
                branch_id: userRow.branch_id,
                role: userRow.role,
                role_id: userRow.role_id,
                email: userRow.email,
                first_name: userRow.first_name,
                last_name: userRow.last_name,
                language_preference: userRow.language_preference,
                permissions: permResult.rows.map((p) => p.code),
            };
        }
        const langHeader = req.headers['accept-language'];
        req.language = (langHeader?.toLowerCase().includes('am') ? 'am' : (req.user?.language_preference || 'en'));
        next();
    }
    catch (error) {
        next();
    }
};
exports.optionalAuthMiddleware = optionalAuthMiddleware;
//# sourceMappingURL=authMiddleware.js.map