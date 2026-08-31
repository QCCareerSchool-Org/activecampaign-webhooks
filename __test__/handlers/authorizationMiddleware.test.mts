import type { Request, Response } from 'express';
import { createHmac } from 'node:crypto';

import { getAuthorizationMiddleware } from '../../src/handlers/authorizationMiddleware.mjs';

const secretKey = 'unit-test-secret';
const headerName = 'x-signature';

const sign = (body: string): string => createHmac('sha256', secretKey).update(Buffer.from(body)).digest('hex');

const createRequest = (headers: Record<string, string | string[] | undefined>, body?: Buffer): Request => {
  return { headers, body } as Request;
};

const createResponse = (): Response => {
  return {
    status: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
  } as Partial<Response> as Response;
};

describe('getAuthorizationMiddleware', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('skips verification entirely when NODE_ENV is development', () => {
    process.env.NODE_ENV = 'development';
    const middleware = getAuthorizationMiddleware(secretKey);
    const req = createRequest({});
    const res = createResponse();
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('rejects with 401 when the signature header is missing', () => {
    const middleware = getAuthorizationMiddleware(secretKey);
    const req = createRequest({}, Buffer.from('payload'));
    const res = createResponse();
    const next = jest.fn();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith({ message: 'Signature header not found' });
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects with 401 when the signature header is an empty array', () => {
    const middleware = getAuthorizationMiddleware(secretKey);
    const req = createRequest({ [headerName]: [] }, Buffer.from('payload'));
    const res = createResponse();
    const next = jest.fn();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith({ message: 'Signature header not found' });
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects with 500 when the raw body is missing', () => {
    const middleware = getAuthorizationMiddleware(secretKey);
    const req = createRequest({ [headerName]: 'f'.repeat(64) });
    const res = createResponse();
    const next = jest.fn();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({ message: 'Raw body not found' });
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects with 401 and does not call next() when the signature is invalid', () => {
    const middleware = getAuthorizationMiddleware(secretKey);
    const req = createRequest({ [headerName]: 'f'.repeat(64) }, Buffer.from('payload'));
    const res = createResponse();
    const next = jest.fn();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith({ message: 'Invalid signature' });
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects with 401 and does not throw when the signature has a different length', () => {
    const middleware = getAuthorizationMiddleware(secretKey);
    const req = createRequest({ [headerName]: 'too-short' }, Buffer.from('payload'));
    const res = createResponse();
    const next = jest.fn();

    expect(() => {
      middleware(req, res, next);
    }).not.toThrow();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next() and does not respond when the signature is valid', () => {
    const middleware = getAuthorizationMiddleware(secretKey);
    const req = createRequest({ [headerName]: sign('payload') }, Buffer.from('payload'));
    const res = createResponse();
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.send).not.toHaveBeenCalled();
  });

  it('accepts the first value when the signature header is sent as an array', () => {
    const middleware = getAuthorizationMiddleware(secretKey);
    const req = createRequest({ [headerName]: [ sign('payload'), 'ignored' ] }, Buffer.from('payload'));
    const res = createResponse();
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });
});
