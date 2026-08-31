import type { Result } from 'generic-result-type';
import { failure, success } from 'generic-result-type';

import { activeCampaignFetch } from '../index.mjs';

interface Contact {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
}

export const putContact = async (id: bigint, contact: Contact, signal: AbortSignal | null = null): Promise<Result> => {
  try {
    const body = { contact };

    const response = await activeCampaignFetch(`/contacts/${id}`, { method: 'PUT', body: JSON.stringify(body), signal });

    if (!response.ok) {
      return failure(Error(response.statusText));
    }

    const responseBody = await response.json();

    if (!(typeof responseBody === 'object' && responseBody !== null && 'contact' in responseBody)) {
      return failure(Error('contact key missing'));
    }

    return success();

  } catch (err) {
    if (!signal?.aborted) {
      console.error(err);
    }
    return failure(err instanceof Error ? err : Error(String(err)));
  }
};
