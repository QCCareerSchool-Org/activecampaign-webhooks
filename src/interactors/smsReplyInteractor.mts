import type { Result } from 'generic-result-type';
import { success } from 'generic-result-type';

import type { SMSReply } from '#domain/activecampaign/smsReply.mjs';

export const smsReplyInteractor = async (sms: SMSReply): Promise<Result> => {
  return success();
};
