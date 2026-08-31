import { z } from 'zod';

export interface SMSReply {
  from: string;
}

export const isSmsReply = (value: unknown): value is SMSReply => {
  return typeof value === 'object' && value !== null;
};

export const smsReplySchema = z.object({
  from: z.string(),
});
