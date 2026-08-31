import { fetchWithRetry } from '../../src/lib/fetchWithRetry.mjs';
import { sleep } from '../../src/lib/sleep.mjs';

jest.mock('../../src/lib/sleep.mjs', () => ({
  sleep: jest.fn().mockResolvedValue(undefined),
}));

const sleepMock = jest.mocked(sleep);

const url = 'https://example.test/webhook';

const toError = (reason: unknown): Error => (reason instanceof Error ? reason : new Error(String(reason)));

beforeEach(() => {
  jest.spyOn(console, 'warn').mockImplementation(() => undefined);
});

afterEach(() => {
  jest.restoreAllMocks();
  sleepMock.mockClear();
});

describe('fetchWithRetry', () => {
  it('falls back to the current backoff when Retry-After is missing', async () => {
    jest.spyOn(global, 'fetch')
      .mockImplementationOnce(async () => new Response('', { status: 429 }))
      .mockImplementationOnce(async () => new Response('ok', { status: 200 }));

    await fetchWithRetry(url, {}, 5, 1500);

    expect(sleepMock).toHaveBeenCalledWith(1500);
  });

  it('honors an HTTP-date Retry-After header', async () => {
    const retryAfterDate = new Date(Date.now() + 5000).toUTCString();
    jest.spyOn(global, 'fetch')
      .mockImplementationOnce(async () => new Response('', { status: 429, headers: { 'Retry-After': retryAfterDate } }))
      .mockImplementationOnce(async () => new Response('ok', { status: 200 }));

    await fetchWithRetry(url, {}, 5, 1000);

    const delay = sleepMock.mock.calls[0]?.[0];
    expect(delay).toBeGreaterThan(4000);
    expect(delay).toBeLessThanOrEqual(5000);
  });

  it('returns a successful response immediately without sleeping', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockImplementation(async () => new Response('ok', { status: 200 }));

    const response = await fetchWithRetry(url);

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(sleepMock).not.toHaveBeenCalled();
  });

  it('retries after a 429 and honors a numeric Retry-After header', async () => {
    const fetchMock = jest.spyOn(global, 'fetch')
      .mockImplementationOnce(async () => new Response('', { status: 429, headers: { 'Retry-After': '2' } }))
      .mockImplementationOnce(async () => new Response('ok', { status: 200 }));

    const response = await fetchWithRetry(url, {}, 5, 1000);

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(sleepMock).toHaveBeenCalledWith(2000);
  });

  it('clamps a Retry-After below the current backoff up to the backoff', async () => {
    jest.spyOn(global, 'fetch')
      .mockImplementationOnce(async () => new Response('', { status: 429, headers: { 'Retry-After': '0' } }))
      .mockImplementationOnce(async () => new Response('ok', { status: 200 }));

    await fetchWithRetry(url, {}, 5, 1000);

    expect(sleepMock).toHaveBeenCalledWith(1000);
  });

  it('clamps an excessive Retry-After down to the 30 second ceiling', async () => {
    jest.spyOn(global, 'fetch')
      .mockImplementationOnce(async () => new Response('', { status: 429, headers: { 'Retry-After': '3600' } }))
      .mockImplementationOnce(async () => new Response('ok', { status: 200 }));

    await fetchWithRetry(url, {}, 5, 1000);

    expect(sleepMock).toHaveBeenCalledWith(30_000);
  });

  it('drains the body of a discarded 429 response before retrying', async () => {
    const rateLimited = new Response('', { status: 429 });
    if (!rateLimited.body) {
      throw new Error('expected the response to have a body');
    }
    const cancelSpy = jest.spyOn(rateLimited.body, 'cancel');
    jest.spyOn(global, 'fetch')
      .mockImplementationOnce(async () => rateLimited)
      .mockImplementationOnce(async () => new Response('ok', { status: 200 }));

    await fetchWithRetry(url, {}, 5, 1);

    expect(cancelSpy).toHaveBeenCalledTimes(1);
  });

  it('gives up after exhausting retries and returns the last 429 response instead of looping forever', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockImplementation(async () => new Response('', { status: 429 }));

    const response = await fetchWithRetry(url, {}, 1, 1);

    expect(response.status).toBe(429);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(sleepMock).toHaveBeenCalledTimes(1);
  });

  it('retries a network error with doubling backoff, then succeeds', async () => {
    const fetchMock = jest.spyOn(global, 'fetch')
      .mockImplementationOnce(async () => { throw new Error('ECONNRESET'); })
      .mockImplementationOnce(async () => { throw new Error('ECONNRESET'); })
      .mockImplementationOnce(async () => new Response('ok', { status: 200 }));

    const response = await fetchWithRetry(url, {}, 5, 1000);

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(sleepMock.mock.calls).toEqual([ [ 1000 ], [ 2000 ] ]);
  });

  it('rethrows the original error once retries are exhausted', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockImplementation(async () => { throw new Error('boom'); });

    await expect(fetchWithRetry(url, {}, 2, 1)).rejects.toThrow('boom');
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('gives each attempt a fresh, unaborted signal instead of reusing one across retries', async () => {
    const fetchMock = jest.spyOn(global, 'fetch')
      .mockImplementationOnce(async () => new Response('', { status: 429 }))
      .mockImplementationOnce(async () => new Response('ok', { status: 200 }));

    await fetchWithRetry(url, {}, 5, 1);

    const firstSignal = fetchMock.mock.calls[0]?.[1]?.signal;
    const secondSignal = fetchMock.mock.calls[1]?.[1]?.signal;

    expect(firstSignal).toBeInstanceOf(AbortSignal);
    expect(secondSignal).toBeInstanceOf(AbortSignal);
    expect(firstSignal).not.toBe(secondSignal);
    expect(firstSignal?.aborted).toBe(false);
    expect(secondSignal?.aborted).toBe(false);
  });

  it('combines a caller-supplied signal with the internal timeout via AbortSignal.any', async () => {
    const controller = new AbortController();
    const fetchMock = jest.spyOn(global, 'fetch').mockImplementation(async () => new Response('ok', { status: 200 }));

    await fetchWithRetry(url, { signal: controller.signal });

    const usedSignal = fetchMock.mock.calls[0]?.[1]?.signal;

    expect(usedSignal).not.toBe(controller.signal);
    expect(usedSignal?.aborted).toBe(false);

    controller.abort(new Error('cancelled by caller'));

    expect(usedSignal?.aborted).toBe(true);
  });

  it('aborts a hanging attempt after timeoutMs and lets a fresh, non-poisoned retry succeed', async () => {
    let attempt = 0;
    jest.spyOn(global, 'fetch').mockImplementation(async (_input, options) => {
      const { signal } = options ?? {};
      if (signal?.aborted) {
        return Promise.reject(toError(signal.reason));
      }

      attempt += 1;
      if (attempt === 1) {
        return new Promise<Response>((_resolve, reject) => {
          signal?.addEventListener('abort', () => {
            reject(toError(signal.reason));
          });
        });
      }

      return new Response('ok', { status: 200 });
    });

    const response = await fetchWithRetry(url, {}, 1, 1, 10);

    expect(response.status).toBe(200);
    expect(attempt).toBe(2);
  });
});
