import type { RequestHandler } from 'express';

export const getRequestLogMiddleware = (depth = 5): RequestHandler => (req, _res, next) => {
  console.log(req.rawBody?.toString('base64'));
  console.dir(req.body, { depth });

  next();
};
