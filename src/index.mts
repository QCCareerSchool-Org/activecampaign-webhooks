import compression from 'compression';
import express from 'express';
import helmet from 'helmet';

import { getAuthorizationMiddleware } from '#handlers/authorizationMiddleware.mjs';
import { getRequestLogMiddleware } from '#handlers/getRequestLogMiddleware.mjs';
import { globalErrorHandler } from '#handlers/globalErrorHandler.mjs';
import { rawBodyParserMiddleware } from '#handlers/rawBodyParserMiddleware.mjs';
import { smsReplyHandler } from '#handlers/smsReplyHandler.mjs';

const secretKey = process.env.SECRET_KEY;
if (!secretKey) {
  throw Error('Environment variable SECRET_KEY not found.');
}

const app = express();

app.use(helmet());
app.use(compression());
app.use(express.raw({ type: 'application/x-www-form-urlencoded' }));
app.use(rawBodyParserMiddleware);

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
