import { waitUntil } from '@vercel/functions';
import type { RequestHandler } from 'express';
import { inspect } from 'node:util';

import { smsSchema } from '#domain/activecampaign/smsReply.mjs';
import { smsReplyInteractor } from '#interactors/smsReplyInteractor.mjs';

export const smsReplyHandler: RequestHandler = (req, res) => {
  const parseResult = smsSchema.safeParse(req.body);
  if (!parseResult.success) {
    console.error(inspect(parseResult.error.issues, false, 10));
    res.status(400).send(parseResult.error.issues);
    return;
  }

  const sms = parseResult.data;
  res.status(200).end();

  waitUntil(
    smsReplyInteractor(sms)
      .then(result => {
        if (!result.success) {
          console.error(result.error.message);
        }
      })
      .catch((err: unknown) => {
        console.error('Unexpected error in background sms reply dispatch', err);
      }),
  );
};
