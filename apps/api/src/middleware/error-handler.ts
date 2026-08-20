import type { ErrorRequestHandler } from 'express';
import multer from 'multer';

import { AppError } from '../errors/app-error.js';

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  void _next;

  if (error instanceof AppError) {
    response.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
      },
    });
    return;
  }

  if (error instanceof multer.MulterError) {
    const fileTooLarge = error.code === 'LIMIT_FILE_SIZE';
    response.status(fileTooLarge ? 413 : 400).json({
      error: {
        code: fileTooLarge ? 'FILE_TOO_LARGE' : 'INVALID_UPLOAD',
        message: fileTooLarge ? 'The uploaded file exceeds the size limit' : 'Invalid file upload',
      },
    });
    return;
  }

  console.error('Unexpected request error', error);

  response.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    },
  });
};
