import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', err);

  // Default error
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';

  // OpenAI specific errors
  if (err.type === 'insufficient_quota') {
    statusCode = 429;
    message = 'AI service quota exceeded. Please try again later.';
  }

  // Firebase auth errors
  if (err.code && err.code.startsWith('auth/')) {
    statusCode = 401;
    message = 'Authentication error';
  }

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

