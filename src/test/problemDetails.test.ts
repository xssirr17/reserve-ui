import { describe, it, expect } from 'vitest';
import { parseProblemDetail } from '../api/client';

describe('RFC 7807 Problem Details Parsing', () => {
  it('parses standard Spring ProblemDetail payload correctly', () => {
    const raw = {
      type: 'urn:problem-type:insufficient-capacity',
      title: 'Insufficient Capacity',
      status: 409,
      detail: 'Requested 3 but only 1 capacity left',
      instance: '/api/reservations',
      timestamp: '2026-10-05T12:00:00Z',
      slotId: '56f4a320-faec-444f-a7e9-95a2d5692396',
      requested: 3,
      available: 1,
    };

    const parsed = parseProblemDetail(raw, 409, 'Conflict');
    expect(parsed.title).toBe('Insufficient Capacity');
    expect(parsed.status).toBe(409);
    expect(parsed.detail).toBe('Requested 3 but only 1 capacity left');
    expect(parsed.type).toBe('urn:problem-type:insufficient-capacity');
    expect(parsed.slotId).toBe('56f4a320-faec-444f-a7e9-95a2d5692396');
    expect(parsed.requested).toBe(3);
    expect(parsed.available).toBe(1);
  });

  it('preserves field validation errors map in 400 Bad Request', () => {
    const raw = {
      type: 'urn:problem-type:validation-error',
      title: 'Bad Request',
      status: 400,
      detail: 'Validation failed for request',
      errors: {
        userId: 'must not be blank',
        quantity: 'must be greater than 0',
      },
    };

    const parsed = parseProblemDetail(raw, 400, 'Bad Request');
    expect(parsed.status).toBe(400);
    expect(parsed.errors).toBeDefined();
    expect(parsed.errors?.userId).toBe('must not be blank');
    expect(parsed.errors?.quantity).toBe('must be greater than 0');
  });

  it('handles non-JSON string or fallback statusText', () => {
    const parsed = parseProblemDetail('Internal server connection timed out', 504, 'Gateway Timeout');
    expect(parsed.title).toBe('Gateway Timeout');
    expect(parsed.status).toBe(504);
    expect(parsed.detail).toBe('Internal server connection timed out');
  });

  it('falls back gracefully when body is null or undefined', () => {
    const parsed = parseProblemDetail(null, 500, 'Internal Server Error');
    expect(parsed.title).toBe('Internal Server Error');
    expect(parsed.status).toBe(500);
    expect(parsed.detail).toBeUndefined();
  });
});
