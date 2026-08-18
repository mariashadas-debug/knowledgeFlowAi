import type { ErrorRequestHandler } from 'express';

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  void _next;
  console.error('Unexpected request error', error);

  response.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    },
  });
};
