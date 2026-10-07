import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors';
import { ApiResponse } from '../utils/apiResponse';
import { config } from '../../config';

export const errorHandler = (
  err: Error | AppError | any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (config.env === 'development') {
    console.error('💥 Error caught in handler:', err);
  }

  // Handle known AppError
  if (err instanceof AppError) {
    return ApiResponse.error(res, err.message, err.statusCode, err.errors);
  }

  // Handle PostgreSQL specific constraint errors
  if (err.code === '23505') {
    // Unique violation
    return ApiResponse.error(res, `Duplicate entry: a record with the same unique value already exists (${err.detail || ''})`, 409);
  }

  if (err.code === '23503') {
    // Foreign key violation
    return ApiResponse.error(res, `Referenced record does not exist or cannot be deleted (${err.detail || ''})`, 400);
  }

  if (err.code === '23514') {
    // Check violation (e.g. quantity >= 0)
    return ApiResponse.error(res, `Check constraint violated: ${err.detail || err.message}`, 400);
  }

  // Unhandled / 500 error
  const message = config.env === 'production' ? 'Internal server error' : (err.message || 'Internal server error');
  return ApiResponse.error(res, message, 500);
};
