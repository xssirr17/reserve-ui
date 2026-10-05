import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useIdempotencyKey } from '../hooks/useIdempotencyKey';

describe('useIdempotencyKey Hook', () => {
  it('generates an initial UUID upon mount', () => {
    const { result } = renderHook(() =>
      useIdempotencyKey({ slotId: 'slot-1', userId: 'user-1', quantity: 1 })
    );

    expect(result.current.key).toBeDefined();
    expect(typeof result.current.key).toBe('string');
    expect(result.current.key.length).toBeGreaterThan(10);
  });

  it('reuses the exact same key across retries/rerenders with identical inputs', () => {
    const { result, rerender } = renderHook(
      ({ slotId, userId, quantity }) => useIdempotencyKey({ slotId, userId, quantity }),
      {
        initialProps: { slotId: 'slot-1', userId: 'user-1', quantity: 2 },
      }
    );

    const initialKey = result.current.key;

    // Simulate network error retry with same props
    rerender({ slotId: 'slot-1', userId: 'user-1', quantity: 2 });
    expect(result.current.key).toBe(initialKey);

    // Another retry
    rerender({ slotId: 'slot-1', userId: 'user-1', quantity: 2 });
    expect(result.current.key).toBe(initialKey);
  });

  it('generates a new key when the slotId changes', () => {
    const { result, rerender } = renderHook(
      ({ slotId, userId, quantity }) => useIdempotencyKey({ slotId, userId, quantity }),
      {
        initialProps: { slotId: 'slot-1', userId: 'user-1', quantity: 1 },
      }
    );

    const firstKey = result.current.key;
    rerender({ slotId: 'slot-2', userId: 'user-1', quantity: 1 });
    expect(result.current.key).not.toBe(firstKey);
  });

  it('generates a new key when the quantity changes', () => {
    const { result, rerender } = renderHook(
      ({ slotId, userId, quantity }) => useIdempotencyKey({ slotId, userId, quantity }),
      {
        initialProps: { slotId: 'slot-1', userId: 'user-1', quantity: 1 },
      }
    );

    const firstKey = result.current.key;
    rerender({ slotId: 'slot-1', userId: 'user-1', quantity: 3 });
    expect(result.current.key).not.toBe(firstKey);
  });

  it('generates a new key when the userId changes', () => {
    const { result, rerender } = renderHook(
      ({ slotId, userId, quantity }) => useIdempotencyKey({ slotId, userId, quantity }),
      {
        initialProps: { slotId: 'slot-1', userId: 'alice', quantity: 1 },
      }
    );

    const firstKey = result.current.key;
    rerender({ slotId: 'slot-1', userId: 'bob', quantity: 1 });
    expect(result.current.key).not.toBe(firstKey);
  });

  it('allows manual resetKey call', () => {
    const { result } = renderHook(() =>
      useIdempotencyKey({ slotId: 'slot-1', userId: 'user-1', quantity: 1 })
    );

    const originalKey = result.current.key;
    let newKey = '';
    act(() => {
      newKey = result.current.resetKey();
    });

    expect(newKey).not.toBe(originalKey);
    expect(result.current.key).toBe(newKey);
  });
});
