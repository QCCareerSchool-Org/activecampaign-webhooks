import { z } from 'zod';

export interface Contact {
  /** numeric string */
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  /** e.g., "tag1, tag2" */
  tags: string;
  orgname: string;
  ip: string;
  fields: string[];
}

export const contactSchema = z.looseObject({
  id: z.string().regex(/^\d+$/u),
  email: z.email(),
  first_name: z.string(), // eslint-disable-line camelcase
  last_name: z.string(), // eslint-disable-line camelcase
  phone: z.string(),
  tags: z.string(),
  orgname: z.string(),
  ip: z.string(),
  fields: z.array(z.string()),
}) satisfies z.ZodType<Contact>;
