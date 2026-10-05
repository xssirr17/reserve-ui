import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Universal UUID v4 generator with fallback for non-secure contexts or older environments.
 */
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export interface UseIdempotencyKeyProps {
  slotId?: string;
  userId?: string;
  quantity?: number;
}

export interface UseIdempotencyKeyReturn {
  /** The current active idempotency key for this reservation attempt */
  key: string;
  /** Force-generate a new key manually (e.g. after a finalized successful booking) */
  resetKey: () => string;
}

/**
 * Manages an RFC-compliant idempotency key for reservation requests.
 *
 * Rules:
 * 1. Generates an initial UUID key upon opening / mounting.
 * 2. REUSES the exact same key across retries (e.g., after network errors, 503 retry-after, or timeout)
 *    as long as the attempt payload (slotId, userId, quantity) has not changed.
 * 3. Automatically generates a fresh key if any attempt input changes (different slot, different quantity, or different user).
 * 4. Extensible for upcoming idempotency demonstration experiments.
 */
export function useIdempotencyKey(
  { slotId = '', userId = '', quantity = 1 }: UseIdempotencyKeyProps = {}
): UseIdempotencyKeyReturn {
  const [key, setKey] = useState<string>(() => generateUUID());

  // Store previous attempt input signature to detect payload modifications
  const prevAttemptRef = useRef<string>(`${slotId}:${userId}:${quantity}`);

  useEffect(() => {
    const currentAttempt = `${slotId}:${userId}:${quantity}`;
    // If any attempt parameter changed, this is a new attempt -> fresh key required
    if (prevAttemptRef.current !== currentAttempt) {
      prevAttemptRef.current = currentAttempt;
      setKey(generateUUID());
    }
  }, [slotId, userId, quantity]);

  const resetKey = useCallback((): string => {
    const nextKey = generateUUID();
    setKey(nextKey);
    return nextKey;
  }, []);

  return { key, resetKey };
}
