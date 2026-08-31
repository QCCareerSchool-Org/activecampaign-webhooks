import type { RequestHandler } from 'express';
import { inspect } from 'node:util';

import { smsReplySchema } from '#domain/smsReply.mjs';
import { smsReplyInteractor } from '#interactors/smsReplyInteractor.mjs';

export const smsReplyHandler: RequestHandler = async (req, res) => {
  // const parseResult = smsReplySchema.safeParse(req.body);
  // if (!parseResult.success) {
  //   console.error(inspect(parseResult.error.issues, false, 10));
  //   res.status(400).send(parseResult.error.issues);
  //   return;
  // }

  // const smsReply = parseResult.data;

  // const result = await smsReplyInteractor(smsReply);
  // if (!result.success) {
  //   console.error(result.error.message);
  //   res.status(500).send(result.error.message);
  //   return;
  // }

  res.end();
};
