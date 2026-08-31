import type { RequestHandler } from 'express';
import { createHmac, timingSafeEqual } from 'node:crypto';

const headerName = 'x-signature';

export const getAuthorizationMiddleware = (secretKey: string): RequestHandler => (req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    next();
    return;
  }

  const received = Array.isArray(req.headers[headerName])
    ? req.headers[headerName][0] ?? ''
    : req.headers[headerName] ?? '';

  if (!received) {
    res.status(401).send({ message: 'Signature header not found' });
    return;
  }

  if (!req.body) {
    res.status(500).send({ message: 'Raw body not found' });
    return;
  }

  const expected = createHmac('sha256', secretKey)
    .update(req.body as Buffer)
    .digest('hex');

  if (!matches(expected, received)) {
    res.status(401).send({ message: 'Invalid signature' });
    return;
  }

  next();
};

const matches = (a: string, b: string): boolean => {
  if (a.length !== b.length) {
    return false;
  }

  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
};
