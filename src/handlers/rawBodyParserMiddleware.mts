declare module 'node:http' {
  interface IncomingMessage {
    parsedBody: Record<string, unknown>;
  }
}

import type { RequestHandler } from 'express';
import qs from 'qs';

export const rawBodyParserMiddleware: RequestHandler = (req, _res, next) => {
  const rawBody = req.body as Buffer;
  req.parsedBody = qs.parse(rawBody.toString('utf8'));

  next();
};
