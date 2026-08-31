import type { Result } from 'generic-result-type';
import { failure, success } from 'generic-result-type';

import type { SMSReply } from '#domain/activecampaign/smsReply.mjs';
import type { SlackMessage } from '#lib/slack.mjs';
import { escapeMrkdwn, sendSlack } from '#lib/slack.mjs';

export const smsReplyInteractor = async (smsReply: SMSReply): Promise<Result> => {
  const name = escapeMrkdwn(`${smsReply.contact.first_name} ${smsReply.contact.last_name}`);
  const phone = escapeMrkdwn(smsReply.contact.phone);
  const email = escapeMrkdwn(smsReply.contact.email);
  const message = escapeMrkdwn(smsReply.sms.reply);

  const quotedMessage = message
    .split(/\r?\n/u)
    .map(line => `>${line}`)
    .join('\n');

  const payload: SlackMessage = {
    text: `New message from ${name}`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Name:* ${name}\n${email ? `*Email:* ${email}\n` : ''}*Tel:* ${phone}\n${quotedMessage}`,
        },
      },
    ],
  };

  try {
    await sendSlack(payload);
    return success();
  } catch (err) {
    return failure(err instanceof Error ? err : Error(String(err)));
  }
};
