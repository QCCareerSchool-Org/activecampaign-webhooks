import type { Result } from 'generic-result-type';
import { success } from 'generic-result-type';

import type { SMSReply } from '#domain/smsReply.mjs';

export const smsReplyInteractor = async (smsReply: SMSReply): Promise<Result> => {
  console.log(smsReply);
  return success();
};
