import type { RequestHandler } from 'express';

export const getContentTypeMiddleware = (types: string[]): RequestHandler => (req, res, next) => {
  if (!req.is(types)) {
    res.status(415).send({ message: `Unsupported Content-Type, expected one of: ${types.join(', ')}` });
    return;
  }

  next();
};
