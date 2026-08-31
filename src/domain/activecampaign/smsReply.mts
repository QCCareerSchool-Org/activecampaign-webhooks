import { z } from 'zod';

import type { Webhook } from './webhook.mjs';
import { webhookSchema } from './webhook.mjs';

export type SMSReply = Webhook<'sms_reply'> & {
  list: '0';
  sms: {
    /** numeric string */
    id: string;
    reply: string;
    /** e.g., subscribe, forward, unsub, resub */
    result: string;
  };
};

export const smsSchema = webhookSchema.extend({
  type: z.literal('sms_reply'),
  list: z.literal('0'),
  sms: z.looseObject({
    id: z.string().regex(/^\d+$/u),
    reply: z.string(),
    result: z.string(),
  }),
}) satisfies z.ZodType<SMSReply>;
