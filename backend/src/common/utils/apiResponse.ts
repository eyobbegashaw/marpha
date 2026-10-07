import { Response } from 'express';

export interface ApiResponseOptions<T> {
  statusCode?: number;
  success?: boolean;
  message?: string;
  data?: T;
  meta?: Record<string, any>;
}

export class ApiResponse {
  static success<T>(
    res: Response,
    data: T,
    message: string = 'Success',
    statusCode: number = 200,
    meta?: Record<string, any>
  ): Response {
    return res.status(statusCode).json({
      success: true,
      statusCode,
      message,
      data,
      meta,
      timestamp: new Date().toISOString(),
    });
  }

  static created<T>(res: Response, data: T, message: string = 'Created successfully'): Response {
    return this.success(res, data, message, 201);
  }

  static error(
    res: Response,
    message: string = 'An error occurred',
    statusCode: number = 500,
    errors?: any[]
  ): Response {
    return res.status(statusCode).json({
      success: false,
      statusCode,
      message,
      errors: errors || null,
      timestamp: new Date().toISOString(),
    });
  }
}
