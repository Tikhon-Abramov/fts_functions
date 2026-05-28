import type { ZodIssue } from 'zod';

import { type ArgumentsHost, HttpStatus } from '@nestjs/common';
import { ZodError } from 'zod';

import { Prisma } from '@prisma-client';
import { ErrorCode } from '@registry/shared';

import {
  DuplicateTreeEdgeException,
  FtsFunctionNotFoundException,
  TreeSelfLoopException,
  TypeCategoryMismatchException,
  UserRoleMismatchException,
} from '../errors/exceptions';

import { GlobalExceptionFilter } from './global-exception.filter';

type ErrorResponseBody = {
  code?: unknown;
  message?: unknown;
  params?: unknown;
  statusCode?: unknown;
  timestamp?: unknown;
};

type MockResponse = {
  status: jest.Mock;
  send: jest.Mock;
  statusArg?: number;
  body?: ErrorResponseBody;
};

function makeHost(): { host: ArgumentsHost; res: MockResponse } {
  const res: MockResponse = {
    status: jest.fn(),
    send: jest.fn(),
  };
  res.status.mockImplementation((code: number) => {
    res.statusArg = code;
    return res;
  });
  res.send.mockImplementation((body: ErrorResponseBody) => {
    res.body = body;
    return res;
  });
  const host = {
    switchToHttp: () => ({
      getResponse: () => res,
      getRequest: () => ({}),
    }),
  } as unknown as ArgumentsHost;
  return { host, res };
}

// Typed loosely so tests can use dotted property access (`body.code`) without
// being rejected by `noPropertyAccessFromIndexSignature`.
function getBody(res: MockResponse): ErrorResponseBody {
  return res.body ?? {};
}

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;

  beforeEach(() => {
    filter = new GlobalExceptionFilter();
    jest.spyOn((filter as any).logger, 'error').mockImplementation(() => undefined);
  });

  it('ZodError → 400 VALIDATION_ERROR', () => {
    const { host, res } = makeHost();
    const zodErr = new ZodError([
      { code: 'custom', path: ['x'], message: 'bad' } as unknown as ZodIssue,
    ]);

    filter.catch(zodErr, host);

    expect(res.statusArg).toBe(HttpStatus.BAD_REQUEST);
    const body = getBody(res);
    expect(body.code).toBe(ErrorCode.VALIDATION_ERROR);
    expect(body.statusCode).toBe(400);
    expect(body.timestamp).toBeDefined();
  });

  it('ZodValidationException wrapper → 400 VALIDATION_ERROR', () => {
    const { host, res } = makeHost();
    const zodErr = new ZodError([
      { code: 'custom', path: ['y'], message: 'bad' } as unknown as ZodIssue,
    ]);
    const wrapper = { name: 'ZodValidationException', error: zodErr };

    filter.catch(wrapper, host);

    expect(getBody(res).code).toBe(ErrorCode.VALIDATION_ERROR);
    expect(res.statusArg).toBe(400);
  });

  it('TypeCategoryMismatchException → 422 with params', () => {
    const { host, res } = makeHost();
    filter.catch(
      new TypeCategoryMismatchException(
        'fts_functions',
        'fts_centralization_id',
        'FTS_CENTRALIZATION',
      ),
      host,
    );

    expect(res.statusArg).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    const body = getBody(res);
    expect(body.code).toBe(ErrorCode.TYPE_CATEGORY_MISMATCH);
    expect(body.params).toEqual({
      table: 'fts_functions',
      column: 'fts_centralization_id',
      category: 'FTS_CENTRALIZATION',
    });
  });

  it('UserRoleMismatchException → 422 with params.slot', () => {
    const { host, res } = makeHost();
    filter.catch(new UserRoleMismatchException('curatorCentralOffice'), host);

    expect(res.statusArg).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    const body = getBody(res);
    expect(body.code).toBe(ErrorCode.USER_ROLE_MISMATCH);
    expect(body.params).toEqual({ slot: 'curatorCentralOffice' });
  });

  it('TreeSelfLoopException → 400 SELF_LOOP_FORBIDDEN', () => {
    const { host, res } = makeHost();
    filter.catch(new TreeSelfLoopException(), host);

    expect(res.statusArg).toBe(HttpStatus.BAD_REQUEST);
    expect(getBody(res).code).toBe(ErrorCode.SELF_LOOP_FORBIDDEN);
  });

  it('DuplicateTreeEdgeException → 400 DUPLICATE_TREE_EDGE', () => {
    const { host, res } = makeHost();
    filter.catch(new DuplicateTreeEdgeException(), host);

    expect(res.statusArg).toBe(HttpStatus.BAD_REQUEST);
    expect(getBody(res).code).toBe(ErrorCode.DUPLICATE_TREE_EDGE);
  });

  it('FtsFunctionNotFoundException → 404 with params.id', () => {
    const { host, res } = makeHost();
    filter.catch(new FtsFunctionNotFoundException(42), host);

    expect(res.statusArg).toBe(HttpStatus.NOT_FOUND);
    const body = getBody(res);
    expect(body.code).toBe(ErrorCode.FTS_FUNCTION_NOT_FOUND);
    expect(body.params).toEqual({ id: 42 });
  });

  it('Prisma P2002 → 409 UNIQUE_CONSTRAINT with params.target', () => {
    const { host, res } = makeHost();
    const err = new Prisma.PrismaClientKnownRequestError('Unique', {
      code: 'P2002',
      clientVersion: 't',
      meta: { target: ['code'] },
    });

    filter.catch(err, host);

    expect(res.statusArg).toBe(HttpStatus.CONFLICT);
    const body = getBody(res);
    expect(body.code).toBe(ErrorCode.UNIQUE_CONSTRAINT);
    expect(body.params).toEqual({ target: ['code'] });
  });

  it('Prisma P2003 → 400 FOREIGN_KEY_CONSTRAINT', () => {
    const { host, res } = makeHost();
    const err = new Prisma.PrismaClientKnownRequestError('FK', {
      code: 'P2003',
      clientVersion: 't',
      meta: { field_name: 'some_fk' },
    });

    filter.catch(err, host);

    expect(res.statusArg).toBe(HttpStatus.BAD_REQUEST);
    const body = getBody(res);
    expect(body.code).toBe(ErrorCode.FOREIGN_KEY_CONSTRAINT);
    expect(body.params).toEqual({ field: 'some_fk' });
  });

  it('Prisma P2025 → 404 RESOURCE_NOT_FOUND', () => {
    const { host, res } = makeHost();
    const err = new Prisma.PrismaClientKnownRequestError('Missing', {
      code: 'P2025',
      clientVersion: 't',
    });

    filter.catch(err, host);

    expect(res.statusArg).toBe(HttpStatus.NOT_FOUND);
    expect(getBody(res).code).toBe(ErrorCode.RESOURCE_NOT_FOUND);
  });

  it('Prisma P2010 with driverAdapterError.message containing TYPE_CATEGORY_MISMATCH → 422', () => {
    const { host, res } = makeHost();
    const err = new Prisma.PrismaClientKnownRequestError('Raw', {
      code: 'P2010',
      clientVersion: 't',
      meta: {
        driverAdapterError: {
          message:
            "ER_SIGNAL_EXCEPTION: 'TYPE_CATEGORY_MISMATCH:fts_functions.fts_centralization_id:FTS_CENTRALIZATION'",
        },
      },
    });

    filter.catch(err, host);

    expect(res.statusArg).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    const body = getBody(res);
    expect(body.code).toBe(ErrorCode.TYPE_CATEGORY_MISMATCH);
    expect(body.params).toEqual({
      table: 'fts_functions',
      column: 'fts_centralization_id',
      category: 'FTS_CENTRALIZATION',
    });
  });

  it('Generic Error → 500 INTERNAL_SERVER_ERROR (does NOT leak message)', () => {
    const { host, res } = makeHost();
    filter.catch(new Error('secret DB connection string'), host);

    expect(res.statusArg).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    const body = getBody(res);
    expect(body.code).toBe(ErrorCode.INTERNAL_SERVER_ERROR);
    expect(body.message).toBe('Internal server error');
    expect(body.message).not.toContain('secret');
  });

  it('Response body matches standard shape', () => {
    const { host, res } = makeHost();
    filter.catch(new FtsFunctionNotFoundException(1), host);
    const body = getBody(res);
    expect(body).toEqual(
      expect.objectContaining({
        statusCode: expect.any(Number),
        code: expect.any(String),
        message: expect.anything(),
        timestamp: expect.any(String),
      }),
    );
  });
});
