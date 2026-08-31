import { sleep } from './sleep.mjs';

/**
 * Fetch with automatic retries on 429 responses
 *
 * Good for a single connection at a time. We should switch to a global queue to handle multiple connections.
 */
export const fetchWithRetry = async (url: string, options: RequestInit = {}, retries = 5, backoff = 1000): Promise<Response> => {
  try {
    const response = await fetch(url, options);

    // If rate-limited, handle the 429 status code
    if (response.status === 429) {
      const retryAfterHeader = response.headers.get('Retry-After');

      const parsedDelay = parseRetryAfterHeader(retryAfterHeader);
      // Never retry faster than our current backoff, even if the header is 0 or stale.
      const delay = Math.max(parsedDelay ?? backoff, backoff);

      if (retries > 0) {
        console.warn(`Rate limited (429). Retrying in ${delay}ms...`);
        // Wait for the specific timeout window
        await sleep(delay);
        // Carry the backoff forward for the next attempt.
        return await fetchWithRetry(url, options, retries - 1, backoff * 2);
      }
    }

    return response;
  } catch (error) {
    if (retries > 0) {
      await sleep(backoff);
      return fetchWithRetry(url, options, retries - 1, backoff * 2);
    }
    throw error;
  }
};

const parseRetryAfterHeader = (value: string | null): number | null => {
  if (value === null) {
    return null;
  }

  const trimmedValue = value.trim();
  if (trimmedValue === '') {
    return null;
  }

  if (/^\d+$/u.test(trimmedValue)) {
    return Number(trimmedValue) * 1000;
  }

  const parsedDate = Date.parse(trimmedValue);
  if (Number.isNaN(parsedDate)) {
    return null;
  }

  return Math.max(parsedDate - Date.now(), 0);
};
