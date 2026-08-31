import type { Result } from 'generic-result-type';
import { failure, success } from 'generic-result-type';

import type { SMSReply } from '#domain/activecampaign/smsReply.mjs';
import { sendSlack } from '#lib/slack.mjs';

export const smsReplyInteractor = async (smsReply: SMSReply): Promise<Result> => {
  const name = `${smsReply.contact.first_name} ${smsReply.contact.last_name}`;
  try {
    await sendSlack(name, smsReply.contact.phone, smsReply.sms.reply);
    return success();
  } catch (err) {
    return failure(err instanceof Error ? err : Error(String(err)));
  }
};
