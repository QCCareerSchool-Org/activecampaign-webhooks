import type { Request, Response } from 'express';

import { getContentTypeMiddleware } from '../../src/handlers/contentTypeMiddleware.mjs';

const createRequest = (contentType: string | undefined): Request => {
  return {
    is: (types: string | string[]) => {
      const candidates = Array.isArray(types) ? types : [ types ];
      return candidates.find(candidate => contentType?.startsWith(candidate)) ?? false;
    },
  } as Request;
};

const createResponse = (): Response => {
  return {
    status: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
  } as Partial<Response> as Response;
};

describe('getContentTypeMiddleware', () => {
  it('calls next() when the content type matches', () => {
    const middleware = getContentTypeMiddleware([ 'application/x-www-form-urlencoded' ]);
    const req = createRequest('application/x-www-form-urlencoded');
    const res = createResponse();
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('rejects with 415 when the content type does not match', () => {
    const middleware = getContentTypeMiddleware([ 'application/x-www-form-urlencoded' ]);
    const req = createRequest('application/json');
    const res = createResponse();
    const next = jest.fn();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(415);
    expect(res.send).toHaveBeenCalledWith({ message: 'Unsupported Content-Type, expected one of: application/x-www-form-urlencoded' });
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects with 415 when the content type header is missing', () => {
    const middleware = getContentTypeMiddleware([ 'application/x-www-form-urlencoded' ]);
    const req = createRequest(undefined);
    const res = createResponse();
    const next = jest.fn();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(415);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next() when the content type matches any of several configured types', () => {
    const middleware = getContentTypeMiddleware([ 'application/json', 'application/x-www-form-urlencoded' ]);
    const req = createRequest('application/x-www-form-urlencoded');
    const res = createResponse();
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('lists every configured type in the 415 message when none match', () => {
    const middleware = getContentTypeMiddleware([ 'application/json', 'application/x-www-form-urlencoded' ]);
    const req = createRequest('text/plain');
    const res = createResponse();
    const next = jest.fn();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(415);
    expect(res.send).toHaveBeenCalledWith({
      message: 'Unsupported Content-Type, expected one of: application/json, application/x-www-form-urlencoded',
    });
    expect(next).not.toHaveBeenCalled();
  });
});
