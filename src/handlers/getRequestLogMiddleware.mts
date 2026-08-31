import type { RequestHandler } from 'express';

export const getRequestLogMiddleware = (depth = 5): RequestHandler => (req, _res, next) => {
  console.log((req.body as Buffer).toString('base64'));
  console.dir(req.parsedBody, { depth });

  next();
};
