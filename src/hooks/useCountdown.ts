import { useState, useEffect, useCallback } from 'react';

export interface UseCountdownReturn {
  minutes: number;
  seconds: number;
  isExpired: boolean;
  formattedTime: string;
  totalRemainingSeconds: number;
}

/**
 * Live countdown hook down to the second.
 * Computes remaining time until target expiration timestamp.
 */
export function useCountdown(
  targetDateOrIso: string | Date | null | undefined,
  onExpire?: () => void
): UseCountdownReturn {
  const calculateRemaining = useCallback((): number => {
    if (!targetDateOrIso) return 0;
    const targetMs =
      typeof targetDateOrIso === 'string'
        ? new Date(targetDateOrIso).getTime()
        : targetDateOrIso.getTime();
    if (isNaN(targetMs)) return 0;
    const diff = Math.floor((targetMs - Date.now()) / 1000);
    return Math.max(0, diff);
  }, [targetDateOrIso]);

  const [remaining, setRemaining] = useState<number>(calculateRemaining);

  useEffect(() => {
    setRemaining(calculateRemaining());

    if (!targetDateOrIso) return;

    const interval = setInterval(() => {
      const nextRemaining = calculateRemaining();
      setRemaining(nextRemaining);

      if (nextRemaining <= 0) {
        clearInterval(interval);
        onExpire?.();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDateOrIso, calculateRemaining, onExpire]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const isExpired = remaining <= 0;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return {
    minutes,
    seconds,
    isExpired,
    formattedTime,
    totalRemainingSeconds: remaining,
  };
}
