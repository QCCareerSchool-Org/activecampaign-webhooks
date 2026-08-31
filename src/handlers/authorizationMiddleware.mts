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

  if (!req.rawBody) {
    res.status(500).send({ message: 'Raw body not found' });
    return;
  }

  const expected = createHmac('sha256', secretKey)
    .update(req.rawBody)
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

  const hex64regex = /^[0-9a-fA-F]{64}$/u;

  if (!hex64regex.test(a) || !hex64regex.test(b)) {
    return false;
  }

  return timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
};
