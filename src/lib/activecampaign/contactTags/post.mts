import type { Result } from 'generic-result-type';
import { failure, success } from 'generic-result-type';

import { stringify } from '#lib/json.mjs';
import { activeCampaignFetch, isErrorResponse } from '../index.mjs';

interface ContactTag {
  contact: bigint;
  tag: bigint;
}

export const postContactTags = async (contactTag: ContactTag, signal: AbortSignal | null = null): Promise<Result> => {
  try {
    const body = { contactTag };

    const response = await activeCampaignFetch(`/contactTags`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: stringify(body),
      signal,
    });

    if (response.status === 422) {
      const responseBody: unknown = await response.json();
      if (isErrorResponse(responseBody)) {
        console.error(responseBody.errors);
        return failure(Error(responseBody.errors[0]?.title));
      }
    }

    if (!response.ok) {
      return failure(Error(response.statusText));
    }

    if (response.status !== 200 && response.status !== 201) {
      return failure(Error('Tag not added'));
    }

    return success();

  } catch (err) {
    if (!signal?.aborted) {
      console.error(err);
    }
    return failure(err instanceof Error ? err : Error(String(err)));
  }
};
