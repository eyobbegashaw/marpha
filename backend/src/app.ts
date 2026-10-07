import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { openApiDocument } from './docs/openapi';
import routes from './routes';
import { errorHandler } from './common/middlewares/errorHandler';
import { config } from './config';

export const createApp = (): Express => {
  const app = express();

  // Security & Middlewares
  app.use(helmet({ contentSecurityPolicy: false })); // allow Swagger UI assets
  app.use(cors({ origin: config.cors.origin }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  if (config.env !== 'test') {
    app.use(morgan('dev'));
  }

  // Health Check
  app.get('/health', (req: Request, res: Response) => {
    res.json({
      status: 'UP',
      timestamp: new Date().toISOString(),
      service: 'Pharmacy Operations & Intelligence Platform API',
      version: '1.0.0',
    });
  });

  // Swagger Documentation
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));
  app.get('/api-docs.json', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(openApiDocument);
  });

  // Main API v1 Routing
  app.use('/api/v1', routes);

  // 404 Handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      statusCode: 404,
      message: `Endpoint ${req.method} ${req.originalUrl} not found`,
    });
  });

  // Global Centralized Error Handler
  app.use(errorHandler);

  return app;
};
