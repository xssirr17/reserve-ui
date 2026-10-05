import { describe, it, expect } from 'vitest';
import {
  formatCapacityLabel,
  getCapacityMetrics,
  groupSlotsByDay,
} from '../lib/format';
import { SlotResponse } from '../api/types';

describe('Format and Capacity Utilities', () => {
  describe('formatCapacityLabel', () => {
    it('handles single capacity (1) as Available / Booked', () => {
      expect(formatCapacityLabel(1, 0)).toBe('Available');
      expect(formatCapacityLabel(1, 1)).toBe('Booked');
      // If reserved somehow exceeds capacity:
      expect(formatCapacityLabel(1, 2)).toBe('Booked');
    });

    it('handles multi-capacity (>1) as "N of M left"', () => {
      expect(formatCapacityLabel(10, 0)).toBe('10 of 10 left');
      expect(formatCapacityLabel(20, 5)).toBe('15 of 20 left');
      expect(formatCapacityLabel(50, 50)).toBe('0 of 50 left');
      expect(formatCapacityLabel(5, 7)).toBe('0 of 5 left');
    });
  });

  describe('getCapacityMetrics', () => {
    it('calculates remaining and percentage correctly', () => {
      const metrics = getCapacityMetrics(20, 5);
      expect(metrics.capacity).toBe(20);
      expect(metrics.reserved).toBe(5);
      expect(metrics.remaining).toBe(15);
      expect(metrics.percentReserved).toBe(25);
      expect(metrics.isFull).toBe(false);
      expect(metrics.isSingle).toBe(false);
    });

    it('flags full capacity properly', () => {
      const metrics = getCapacityMetrics(10, 10);
      expect(metrics.remaining).toBe(0);
      expect(metrics.percentReserved).toBe(100);
      expect(metrics.isFull).toBe(true);
    });
  });

  describe('groupSlotsByDay', () => {
    const fixedNow = new Date('2026-10-06T12:00:00Z');

    const sampleSlots: SlotResponse[] = [
      // Past slot (ended before fixedNow)
      {
        id: 'slot-past',
        resourceId: 'res-1',
        startTime: '2026-10-06T09:00:00Z',
        endTime: '2026-10-06T10:00:00Z',
        capacity: 1,
        reserved: 0,
        createdAt: '2026-10-01T00:00:00Z',
      },
      // Future slot today
      {
        id: 'slot-today-later',
        resourceId: 'res-1',
        startTime: '2026-10-06T15:00:00Z',
        endTime: '2026-10-06T16:00:00Z',
        capacity: 1,
        reserved: 0,
        createdAt: '2026-10-01T00:00:00Z',
      },
      // Future slot tomorrow early
      {
        id: 'slot-tomorrow-1',
        resourceId: 'res-1',
        startTime: '2026-10-07T08:00:00Z',
        endTime: '2026-10-07T09:00:00Z',
        capacity: 10,
        reserved: 2,
        createdAt: '2026-10-01T00:00:00Z',
      },
      // Future slot tomorrow afternoon
      {
        id: 'slot-tomorrow-2',
        resourceId: 'res-1',
        startTime: '2026-10-07T14:00:00Z',
        endTime: '2026-10-07T15:00:00Z',
        capacity: 10,
        reserved: 0,
        createdAt: '2026-10-01T00:00:00Z',
      },
    ];

    it('filters out past slots and groups remaining slots by day', () => {
      const groups = groupSlotsByDay(sampleSlots, fixedNow);

      // Verify past slot is excluded
      const allGroupSlots = groups.flatMap((g) => g.slots);
      expect(allGroupSlots.find((s) => s.id === 'slot-past')).toBeUndefined();

      // Verify active slots remain
      expect(allGroupSlots.length).toBe(3);

      // Verify slots are sorted chronologically
      expect(allGroupSlots[0].id).toBe('slot-today-later');
      expect(allGroupSlots[1].id).toBe('slot-tomorrow-1');
      expect(allGroupSlots[2].id).toBe('slot-tomorrow-2');
    });
  });
});
