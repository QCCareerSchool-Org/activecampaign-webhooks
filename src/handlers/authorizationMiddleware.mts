import type { RequestHandler } from 'express';
import { createHmac, timingSafeEqual } from 'node:crypto';

export const getAuthorizationMiddleware = (secretKey: string): RequestHandler => (req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    next();
    return;
  }

  if (!req.headers['X-Signature']) {
    res.status(401).send({ message: 'Signature header not found' });
    return;
  }
  const received = Array.isArray(req.headers['X-Signature'])
    ? req.headers['X-Signature'][0] ?? ''
    : req.headers['X-Signature'];

  if (!req.rawBody) {
    res.status(500).send({ message: 'Raw body not found' });
    return;
  }

  const expected = createHmac('sha256', secretKey)
    .update(req.rawBody)
    .digest('hex');

  if (!matches(expected, received)) {
    res.status(401).send({ message: 'Invalid signature' });
  }

  next();
};

const matches = (a: string, b: string): boolean => {
  if (a.length !== b.length) {
    return false;
  }

  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
};
