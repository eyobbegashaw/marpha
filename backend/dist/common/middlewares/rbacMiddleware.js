"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requirePermission = exports.requireRoles = void 0;
const errors_1 = require("../errors");
const requireRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new errors_1.UnauthorizedError());
        }
        if (!roles.includes(req.user.role)) {
            return next(new errors_1.ForbiddenError(`Access denied. Requires one of roles: ${roles.join(', ')}`));
        }
        next();
    };
};
exports.requireRoles = requireRoles;
const requirePermission = (permission) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new errors_1.UnauthorizedError());
        }
        if (req.user.role === 'PHARMACY_OWNER') {
            return next(); // Pharmacy Owner has full organization-level access
        }
        if (!req.user.permissions.includes(permission)) {
            return next(new errors_1.ForbiddenError(`Missing required permission: ${permission}`));
        }
        next();
    };
};
exports.requirePermission = requirePermission;
//# sourceMappingURL=rbacMiddleware.js.map