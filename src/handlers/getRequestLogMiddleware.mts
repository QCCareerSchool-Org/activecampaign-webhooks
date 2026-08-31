import type { RequestHandler } from 'express';

export const getRequestLogMiddleware = (depth = 5): RequestHandler => (req, _res, next) => {
  console.dir(req.parsedBody, { depth });
  console.log(req.headers);

  next();
};
