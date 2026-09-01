import type { Result } from 'generic-result-type';
import { failure, success } from 'generic-result-type';

import type { SMSReply } from '#domain/activecampaign/smsReply.mjs';
import type { SlackMessage } from '#lib/slack.mjs';
import { escapeMrkdwn, sendSlack } from '#lib/slack.mjs';
import { getThreadForContact, saveThreadForContact } from '#lib/threadStore.mjs';

export const smsReplyInteractor = async (smsReply: SMSReply): Promise<Result> => {
  const name = escapeMrkdwn(`${smsReply.contact.first_name} ${smsReply.contact.last_name}`);
  const phone = escapeMrkdwn(smsReply.contact.phone);
  const email = escapeMrkdwn(smsReply.contact.email);
  const message = escapeMrkdwn(smsReply.sms.reply);

  const quotedMessage = message
    .split(/\r?\n/u)
    .map(line => `>${line}`)
    .join('\n');

  try {
    const existingThread = await getThreadForContact(smsReply.contact.id).catch((err: unknown) => {
      console.error('Failed to look up existing Slack thread', err);
      return null;
    });

    const payload: SlackMessage = existingThread
      ? {
        text: `Reply from ${name}`,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: quotedMessage,
            },
          },
        ],
      }
      : {
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

    const identifier = await sendSlack(payload, existingThread?.ts);

    if (!existingThread) {
      await saveThreadForContact(smsReply.contact.id, identifier).catch((err: unknown) => {
        console.error('Failed to save Slack thread', err);
      });
    }

    return success();
  } catch (err) {
    return failure(err instanceof Error ? err : Error(String(err)));
  }
};
