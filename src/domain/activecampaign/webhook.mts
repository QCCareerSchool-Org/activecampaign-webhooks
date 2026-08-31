import { z } from 'zod';

import { type Contact, contactSchema } from './contact.mjs';

export interface Webhook<T extends string = string> {
  type: T;
  date_time: string;
  initiated_from: string;
  initiated_by: string;
  /** numeric string */
  list: string;
  contact: Contact;
}

export const webhookSchema = z.looseObject({
  type: z.literal('sms_reply'),
  date_time: z.string(), // eslint-disable-line camelcase
  initiated_from: z.string(), // eslint-disable-line camelcase
  initiated_by: z.string(), // eslint-disable-line camelcase
  list: z.string().regex(/^\d+$/u),
  contact: contactSchema,
}) satisfies z.ZodType<Webhook>;
