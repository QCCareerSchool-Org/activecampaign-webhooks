import type { Result } from 'generic-result-type';
import { success } from 'generic-result-type';

import type { SMS } from '#domain/activecampaign/sms.mjs';

export const smsReplyInteractor = async (sms: SMS): Promise<Result> => {
  return success();
};
