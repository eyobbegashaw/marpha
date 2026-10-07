"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const openapi_1 = require("./docs/openapi");
const routes_1 = __importDefault(require("./routes"));
const errorHandler_1 = require("./common/middlewares/errorHandler");
const config_1 = require("./config");
const createApp = () => {
    const app = (0, express_1.default)();
    // Security & Middlewares
    app.use((0, helmet_1.default)({ contentSecurityPolicy: false })); // allow Swagger UI assets
    app.use((0, cors_1.default)({ origin: config_1.config.cors.origin }));
    app.use(express_1.default.json({ limit: '10mb' }));
    app.use(express_1.default.urlencoded({ extended: true }));
    if (config_1.config.env !== 'test') {
        app.use((0, morgan_1.default)('dev'));
    }
    // Health Check
    app.get('/health', (req, res) => {
        res.json({
            status: 'UP',
            timestamp: new Date().toISOString(),
            service: 'Pharmacy Operations & Intelligence Platform API',
            version: '1.0.0',
        });
    });
    // Swagger Documentation
    app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(openapi_1.openApiDocument));
    app.get('/api-docs.json', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(openapi_1.openApiDocument);
    });
    // Main API v1 Routing
    app.use('/api/v1', routes_1.default);
    // 404 Handler
    app.use((req, res) => {
        res.status(404).json({
            success: false,
            statusCode: 404,
            message: `Endpoint ${req.method} ${req.originalUrl} not found`,
        });
    });
    // Global Centralized Error Handler
    app.use(errorHandler_1.errorHandler);
    return app;
};
exports.createApp = createApp;
//# sourceMappingURL=app.js.map