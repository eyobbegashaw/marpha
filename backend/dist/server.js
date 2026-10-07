"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const config_1 = require("./config");
const connection_1 = require("./database/connection");
const startServer = async () => {
    const isConnected = await connection_1.db.checkConnection();
    if (!isConnected) {
        console.error('❌ Could not establish database connection. Exiting...');
        process.exit(1);
    }
    console.log('✅ PostgreSQL database connected successfully.');
    const app = (0, app_1.createApp)();
    const server = app.listen(config_1.config.port, () => {
        console.log(`🚀 Pharmacy Operations Server running on port ${config_1.config.port}`);
        console.log(`📚 Swagger UI Documentation: http://localhost:${config_1.config.port}/api-docs`);
        console.log(`🏥 Health Check: http://localhost:${config_1.config.port}/health`);
    });
    const gracefulShutdown = () => {
        console.log('🛑 Shutting down gracefully...');
        server.close(() => {
            console.log('Server closed.');
            process.exit(0);
        });
    };
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
};
startServer().catch((err) => {
    console.error('Fatal startup error:', err);
    process.exit(1);
});
//# sourceMappingURL=server.js.map