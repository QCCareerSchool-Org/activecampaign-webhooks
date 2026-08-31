import type { RequestHandler } from 'express';
import { inspect } from 'node:util';

import { smsSchema } from '#domain/activecampaign/smsReply.mjs';
import { smsReplyInteractor } from '#interactors/smsReplyInteractor.mjs';

export const smsReplyHandler: RequestHandler = async (req, res) => {
  const parseResult = smsSchema.safeParse(req.parsedBody);
  if (!parseResult.success) {
    console.error(inspect(parseResult.error.issues, false, 10));
    res.status(400).send(parseResult.error.issues);
    return;
  }

  const sms = parseResult.data;

  const result = await smsReplyInteractor(sms);
  if (!result.success) {
    console.error(result.error.message);
    res.status(500).send(result.error.message);
    return;
  }

  res.end();
};
