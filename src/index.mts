declare module 'node:http' {
  interface IncomingMessage {
    rawBody?: Buffer;
  }
}

import compression from 'compression';
import express from 'express';
import helmet from 'helmet';
import type { IncomingMessage, ServerResponse } from 'node:http';

import { getAuthorizationMiddleware } from '#handlers/authorizationMiddleware.mjs';
import { getContentTypeMiddleware } from '#handlers/contentTypeMiddleware.mjs';
import { getRequestLogMiddleware } from '#handlers/getRequestLogMiddleware.mjs';
import { globalErrorHandler } from '#handlers/globalErrorHandler.mjs';
import { smsReplyHandler } from '#handlers/smsReplyHandler.mjs';

const secretKey = process.env.SECRET_KEY;
if (!secretKey) {
  throw Error('Environment variable SECRET_KEY not found.');
}

const verify = (req: IncomingMessage, _res: ServerResponse, buf: Buffer): void => {
  req.rawBody = buf;
};

const app = express();

app.use(helmet());
app.use(compression());
app.use(getContentTypeMiddleware([ 'application/x-www-form-urlencoded' ]));
app.use(express.urlencoded({ extended: true, verify }));

app.use(getAuthorizationMiddleware(secretKey));

app.use(getRequestLogMiddleware(15));

app.post('/sms/replies', smsReplyHandler);

app.use(globalErrorHandler);

if (process.env.NODE_ENV !== 'production') {
  const port = process.env.PORT ?? 8080;
  app.listen(port, () => {
    console.log(`listening on port ${port}`);
  });
}

export default app;
