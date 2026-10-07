"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiResponse = void 0;
class ApiResponse {
    static success(res, data, message = 'Success', statusCode = 200, meta) {
        return res.status(statusCode).json({
            success: true,
            statusCode,
            message,
            data,
            meta,
            timestamp: new Date().toISOString(),
        });
    }
    static created(res, data, message = 'Created successfully') {
        return this.success(res, data, message, 201);
    }
    static error(res, message = 'An error occurred', statusCode = 500, errors) {
        return res.status(statusCode).json({
            success: false,
            statusCode,
            message,
            errors: errors || null,
            timestamp: new Date().toISOString(),
        });
    }
}
exports.ApiResponse = ApiResponse;
//# sourceMappingURL=apiResponse.js.map