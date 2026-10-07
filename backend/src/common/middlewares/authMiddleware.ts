import { Request, Response, NextFunction } from 'express';
import { tokenHelper } from '../utils/tokenHelper';
import { db } from '../../database/connection';
import { UnauthorizedError } from '../errors';

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No authentication token provided');
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = tokenHelper.verifyToken(token);
    } catch (err) {
      throw new UnauthorizedError('Invalid or expired authentication token');
    }

    // Fetch user details and permissions from database
    const userResult = await db.query(
      `SELECT u.id, u.organization_id, u.branch_id, u.role_id, r.name AS role,
              u.email, u.first_name, u.last_name, u.language_preference, u.is_active
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.id = $1`,
      [decoded.userId]
    );

    if (userResult.rows.length === 0 || !userResult.rows[0].is_active) {
      throw new UnauthorizedError('User account not found or inactive');
    }

    const userRow = userResult.rows[0];

    // Fetch permissions for this role
    const permResult = await db.query(
      `SELECT p.code
       FROM role_permissions rp
       JOIN permissions p ON rp.permission_id = p.id
       WHERE rp.role_id = $1`,
      [userRow.role_id]
    );

    const permissions = permResult.rows.map((p) => p.code);

    const langHeader = req.headers['accept-language'];
    const requestedLang = (langHeader?.toLowerCase().includes('am') ? 'am' : (userRow.language_preference || 'en')) as 'en' | 'am';

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
  } catch (error) {
    next(error);
  }
};

export const optionalAuthMiddleware = async (req: Request, res: Response, next: NextFunction) => {
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
      decoded = tokenHelper.verifyToken(token);
    } catch (err) {
      return next(); // Proceed without req.user for invalid optional token
    }

    const userResult = await db.query(
      `SELECT u.id, u.organization_id, u.branch_id, u.role_id, r.name AS role,
              u.email, u.first_name, u.last_name, u.language_preference, u.is_active
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.id = $1`,
      [decoded.userId]
    );

    if (userResult.rows.length > 0 && userResult.rows[0].is_active) {
      const userRow = userResult.rows[0];
      const permResult = await db.query(
        `SELECT p.code
         FROM role_permissions rp
         JOIN permissions p ON rp.permission_id = p.id
         WHERE rp.role_id = $1`,
        [userRow.role_id]
      );
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
    req.language = (langHeader?.toLowerCase().includes('am') ? 'am' : (req.user?.language_preference || 'en')) as 'en' | 'am';
    next();
  } catch (error) {
    next();
  }
};
