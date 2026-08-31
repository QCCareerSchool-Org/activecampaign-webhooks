import type { RequestHandler } from 'express';

export const getRequestLogMiddleware = (depth = 5): RequestHandler => (req, _res, next) => {
  const body: unknown = req.body;
  if (typeof body === 'object' && body !== null && 'secret_key' in body) {
    // eslint-disable-next-line camelcase
    body.secret_key = '<redacted>';
  }

  console.dir(body, { depth });
  console.log(req.headers);

  next();
};
