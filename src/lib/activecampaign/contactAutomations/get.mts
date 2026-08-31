import type { Result } from 'generic-result-type';
import { failure, success } from 'generic-result-type';
import { z } from 'zod';

import { activeCampaignFetch } from '../index.mjs';

export enum ContactListStatus {
  ACTIVE = 1,
  UNSUBSCRIBED = 2,
};

export const getContactAutomations = async (contactId: bigint, signal: AbortSignal | null = null): Promise<Result<ContactAutomation[]>> => {
  try {
    const response = await activeCampaignFetch(`/contacts/${contactId}/contactAutomations`, { signal });

    if (!response.ok) {
      return failure(Error(response.statusText));
    }

    const responseBody = await response.json();
    if (!(typeof responseBody === 'object' && responseBody !== null && 'contactAutomations' in responseBody && Array.isArray(responseBody.contactAutomations))) {
      return failure(Error('Invalid response'));
    }

    const contactAutomations = responseBody.contactAutomations
      .map(c => schema.safeParse(c))
      .filter(r => { if (!r.success) { console.error(r.error); } return r.success; })
      .map(r => r.data);

    return success(contactAutomations);

  } catch (err) {
    if (!signal?.aborted) {
      console.error(err);
    }
    return failure(err instanceof Error ? err : Error(String(err)));
  }
};

interface ContactAutomation {
  contact: bigint;
  automation: bigint;
  completed: boolean;
}

const schema: z.ZodType<ContactAutomation> = z.object({
  contact: z.coerce.bigint(),
  automation: z.coerce.bigint(),
  completed: z.coerce.boolean(),
});
