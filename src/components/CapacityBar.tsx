import React from 'react';
import { formatCapacityLabel, getCapacityMetrics } from '../lib/format';

export interface CapacityBarProps {
  capacity: number;
  reserved: number;
  compact?: boolean;
}

export const CapacityBar: React.FC<CapacityBarProps> = ({
  capacity,
  reserved,
  compact = false,
}) => {
  const metrics = getCapacityMetrics(capacity, reserved);
  const label = formatCapacityLabel(capacity, reserved);

  // Single capacity slot (e.g. doctor appointment, 1-person room)
  if (metrics.isSingle) {
    return (
      <div className="flex items-center gap-2">
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
            metrics.isFull
              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800/50'
              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
              metrics.isFull ? 'bg-rose-500' : 'bg-emerald-500'
            }`}
          />
          {label}
        </span>
      </div>
    );
  }

  // Multi-capacity slot (e.g. classroom of 20, workshop)
  const percentAvailable = 100 - metrics.percentReserved;
  const isLow = percentAvailable > 0 && percentAvailable <= 20;

  return (
    <div className={`w-full ${compact ? 'space-y-1' : 'space-y-1.5'}`}>
      <div className="flex justify-between items-center text-xs">
        <span
          className={`font-medium ${
            metrics.isFull
              ? 'text-rose-600 dark:text-rose-400'
              : isLow
              ? 'text-amber-600 dark:text-amber-400'
              : 'text-slate-700 dark:text-slate-300'
          }`}
        >
          {label}
        </span>
        <span className="text-slate-500 dark:text-slate-400 text-[11px]">
          {metrics.reserved} / {metrics.capacity} booked
        </span>
      </div>

      <div
        className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden flex"
        role="progressbar"
        aria-valuenow={metrics.remaining}
        aria-valuemin={0}
        aria-valuemax={metrics.capacity}
        aria-label={`Capacity: ${metrics.remaining} of ${metrics.capacity} available`}
      >
        <div
          className={`h-full transition-all duration-300 ${
            metrics.isFull
              ? 'bg-rose-500'
              : isLow
              ? 'bg-amber-500'
              : 'bg-indigo-600 dark:bg-indigo-500'
          }`}
          style={{ width: `${metrics.percentReserved}%` }}
        />
      </div>
    </div>
  );
};
