import { SlotResponse } from '../api/types';

/**
 * Returns the client user's local time zone name.
 */
export function getUserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

/**
 * Formats an ISO-8601 UTC date string into a local human-readable date.
 * E.g., "Monday, Oct 6, 2026"
 */
export function formatLocalDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    return new Intl.DateTimeFormat(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  } catch {
    return isoString;
  }
}

/**
 * Formats an ISO-8601 UTC date string into local time.
 * E.g., "08:06 AM" or "08:06"
 */
export function formatLocalTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    return new Intl.DateTimeFormat(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return isoString;
  }
}

/**
 * Formats a slot's start and end time range in the local time zone.
 * E.g., "08:06 – 10:06"
 */
export function formatTimeRange(startIso: string, endIso: string): string {
  return `${formatLocalTime(startIso)} – ${formatLocalTime(endIso)}`;
}

/**
 * Formats an ISO date into full local date and time.
 * E.g., "Oct 6, 2026, 08:06 AM"
 */
export function formatLocalDateTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  } catch {
    return isoString;
  }
}

/**
 * Generic capacity label rule:
 * Capacity 1 reads as "Available / Booked";
 * Capacity > 1 reads as "N of M left".
 */
export function formatCapacityLabel(capacity: number, reserved: number): string {
  const remaining = Math.max(0, capacity - reserved);
  if (capacity <= 1) {
    return remaining > 0 ? 'Available' : 'Booked';
  }
  return `${remaining} of ${capacity} left`;
}

export interface CapacityMetrics {
  capacity: number;
  reserved: number;
  remaining: number;
  percentReserved: number;
  isFull: boolean;
  isSingle: boolean;
}

export function getCapacityMetrics(capacity: number, reserved: number): CapacityMetrics {
  const safeCapacity = Math.max(1, capacity);
  const safeReserved = Math.max(0, Math.min(reserved, safeCapacity));
  const remaining = Math.max(0, safeCapacity - safeReserved);
  const percentReserved = Math.min(100, Math.round((safeReserved / safeCapacity) * 100));

  return {
    capacity: safeCapacity,
    reserved: safeReserved,
    remaining,
    percentReserved,
    isFull: remaining <= 0,
    isSingle: safeCapacity === 1,
  };
}

export interface DayGroup {
  dateKey: string;
  displayDate: string;
  slots: SlotResponse[];
}

/**
 * Filters out past slots and groups remaining slots by local calendar day.
 */
export function groupSlotsByDay(
  slots: SlotResponse[],
  now: Date = new Date()
): DayGroup[] {
  const nowMs = now.getTime();

  // Filter out slots that have already ended
  const activeSlots = slots.filter((slot) => {
    const endMs = new Date(slot.endTime).getTime();
    return !isNaN(endMs) && endMs > nowMs;
  });

  // Sort chronologically by startTime
  activeSlots.sort((a, b) => {
    return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
  });

  const groupMap = new Map<string, SlotResponse[]>();

  for (const slot of activeSlots) {
    const startDate = new Date(slot.startTime);
    // YYYY-MM-DD in local time
    const year = startDate.getFullYear();
    const month = String(startDate.getMonth() + 1).padStart(2, '0');
    const day = String(startDate.getDate()).padStart(2, '0');
    const key = `${year}-${month}-${day}`;

    if (!groupMap.has(key)) {
      groupMap.set(key, []);
    }
    groupMap.get(key)!.push(slot);
  }

  const result: DayGroup[] = [];
  for (const [dateKey, daySlots] of groupMap.entries()) {
    result.push({
      dateKey,
      displayDate: formatLocalDate(daySlots[0].startTime),
      slots: daySlots,
    });
  }

  return result;
}

/**
 * Returns default date range (now until 7 days ahead) in UTC ISO-8601 strings.
 */
export function getDefaultDateRange(daysAhead = 7): { from: string; to: string } {
  const fromDate = new Date();
  const toDate = new Date(fromDate.getTime() + daysAhead * 24 * 60 * 60 * 1000);
  return {
    from: fromDate.toISOString(),
    to: toDate.toISOString(),
  };
}
