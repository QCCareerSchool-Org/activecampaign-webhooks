declare module 'node:http' {
  interface IncomingMessage {
    rawBody?: Buffer;
  }
}

import express from 'express';

export const rawBodyJsonMiddleware = express.json({ verify: (req, _res, buf) => { req.rawBody = buf; } });
