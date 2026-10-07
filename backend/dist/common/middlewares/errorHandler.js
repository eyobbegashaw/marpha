"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const errors_1 = require("../errors");
const apiResponse_1 = require("../utils/apiResponse");
const config_1 = require("../../config");
const errorHandler = (err, req, res, next) => {
    if (config_1.config.env === 'development') {
        console.error('💥 Error caught in handler:', err);
    }
    // Handle known AppError
    if (err instanceof errors_1.AppError) {
        return apiResponse_1.ApiResponse.error(res, err.message, err.statusCode, err.errors);
    }
    // Handle PostgreSQL specific constraint errors
    if (err.code === '23505') {
        // Unique violation
        return apiResponse_1.ApiResponse.error(res, `Duplicate entry: a record with the same unique value already exists (${err.detail || ''})`, 409);
    }
    if (err.code === '23503') {
        // Foreign key violation
        return apiResponse_1.ApiResponse.error(res, `Referenced record does not exist or cannot be deleted (${err.detail || ''})`, 400);
    }
    if (err.code === '23514') {
        // Check violation (e.g. quantity >= 0)
        return apiResponse_1.ApiResponse.error(res, `Check constraint violated: ${err.detail || err.message}`, 400);
    }
    // Unhandled / 500 error
    const message = config_1.config.env === 'production' ? 'Internal server error' : (err.message || 'Internal server error');
    return apiResponse_1.ApiResponse.error(res, message, 500);
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=errorHandler.js.map