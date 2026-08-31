import type { ErrorRequestHandler } from 'express';

export const globalErrorHandler: ErrorRequestHandler = (err, req, res, next) => {
  console.error('global error handler', err);
  if (!res.headersSent) {
    res.status(500).send(JSON.stringify(err));
  } else {
    next(err);
  }
};
