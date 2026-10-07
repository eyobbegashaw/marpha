import { createApp } from './app';
import { config } from './config';
import { db } from './database/connection';

const startServer = async () => {
  const isConnected = await db.checkConnection();
  if (!isConnected) {
    console.error('❌ Could not establish database connection. Exiting...');
    process.exit(1);
  }
  console.log('✅ PostgreSQL database connected successfully.');

  const app = createApp();

  const server = app.listen(config.port, () => {
    console.log(`🚀 Pharmacy Operations Server running on port ${config.port}`);
    console.log(`📚 Swagger UI Documentation: http://localhost:${config.port}/api-docs`);
    console.log(`🏥 Health Check: http://localhost:${config.port}/health`);
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
