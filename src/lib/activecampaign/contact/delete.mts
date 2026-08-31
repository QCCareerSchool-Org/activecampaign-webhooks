import type { Result } from 'generic-result-type';
import { failure, success } from 'generic-result-type';

import { activeCampaignFetch } from '../index.mjs';

export const deleteContact = async (id: bigint, signal: AbortSignal | null = null): Promise<Result> => {
  try {
    const response = await activeCampaignFetch(`/contacts/${id}`, { method: 'delete', signal });

    if (!response.ok) {
      return failure(Error(response.statusText));
    }

    return success();

  } catch (err) {
    if (!signal?.aborted) {
      console.error(err);
    }
    return failure(err instanceof Error ? err : Error(String(err)));
  }
};
