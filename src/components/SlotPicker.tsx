import React, { useState } from 'react';
import { ResourceResponse, SlotResponse } from '../api/types';
import { useAvailability } from '../hooks/useAvailability';
import {
  formatTimeRange,
  getUserTimeZone,
  groupSlotsByDay,
} from '../lib/format';
import { CapacityBar } from './CapacityBar';
import { Clock, Globe, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';

export interface SlotPickerProps {
  resource: ResourceResponse;
  selectedSlot: SlotResponse | null;
  onSelectSlot: (slot: SlotResponse) => void;
}

export const SlotPicker: React.FC<SlotPickerProps> = ({
  resource,
  selectedSlot,
  onSelectSlot,
}) => {
  const userTz = getUserTimeZone();

  // Initialize with local dates: today to +7 days
  const getLocalDateString = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const today = new Date();
  const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [startDateStr, setStartDateStr] = useState<string>(() => getLocalDateString(today));
  const [endDateStr, setEndDateStr] = useState<string>(() => getLocalDateString(nextWeek));

  // Convert local YYYY-MM-DD to UTC ISO-8601 strings (...Z)
  const fromIso = React.useMemo(() => {
    try {
      const d = new Date(`${startDateStr}T00:00:00`);
      return d.toISOString();
    } catch {
      return new Date().toISOString();
    }
  }, [startDateStr]);

  const toIso = React.useMemo(() => {
    try {
      const d = new Date(`${endDateStr}T23:59:59.999`);
      return d.toISOString();
    } catch {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      return d.toISOString();
    }
  }, [endDateStr]);

  const {
    data: availabilityData,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useAvailability(resource.id, {
    from: fromIso,
    to: toIso,
    size: 100,
  });

  const dayGroups = React.useMemo(
    () => groupSlotsByDay(availabilityData?.content || []),
    [availabilityData?.content]
  );

  return (
    <div className="space-y-6">
      {/* Header & Date Controls */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Select a Slot for &ldquo;{resource.name}&rdquo;
            </h2>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 dark:text-slate-400">
              <Globe className="w-3.5 h-3.5 text-brand-500" />
              <span>
                Times displayed in your local time zone (<strong>{userTz}</strong>)
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors self-start md:self-auto focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            <span>{isFetching ? 'Updating…' : 'Refresh availability'}</span>
          </button>
        </div>

        {/* Date Filters */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
          <div>
            <label
              htmlFor="start-date"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
            >
              From Date
            </label>
            <input
              id="start-date"
              type="date"
              value={startDateStr}
              onChange={(e) => setStartDateStr(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label
              htmlFor="end-date"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
            >
              To Date
            </label>
            <input
              id="end-date"
              type="date"
              value={endDateStr}
              onChange={(e) => setEndDateStr(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Quick presets */}
          <div className="sm:col-span-2 flex items-center gap-2 pt-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">Presets:</span>
            <button
              type="button"
              onClick={() => {
                const now = new Date();
                const end = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
                setStartDateStr(getLocalDateString(now));
                setEndDateStr(getLocalDateString(end));
              }}
              className="px-2.5 py-1 text-xs rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
            >
              Next 7 days
            </button>
            <button
              type="button"
              onClick={() => {
                const now = new Date();
                const end = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
                setStartDateStr(getLocalDateString(now));
                setEndDateStr(getLocalDateString(end));
              }}
              className="px-2.5 py-1 text-xs rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
            >
              Next 14 days
            </button>
          </div>
        </div>
      </div>

      {/* Slots Section */}
      {isLoading ? (
        <div className="space-y-4">
          <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-28 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 animate-pulse"
              />
            ))}
          </div>
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 p-5 text-center">
          <AlertCircle className="w-6 h-6 text-rose-500 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-rose-800 dark:text-rose-200">
            {error?.problem?.title || 'Failed to load availability'}
          </h3>
          <p className="text-xs text-rose-600 dark:text-rose-400 mt-1 max-w-md mx-auto">
            {error?.problem?.detail || 'An unexpected error occurred while retrieving slots.'}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-rose-600 hover:bg-rose-700 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Try again
          </button>
        </div>
      ) : dayGroups.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-8 text-center">
          <Clock className="w-8 h-8 text-slate-400 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            No free slots in this range
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            There are no upcoming slots scheduled for &ldquo;{resource.name}&rdquo; between the selected dates. Try expanding your date range.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {dayGroups.map((group) => (
            <div key={group.dateKey} className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <span>{group.displayDate}</span>
                <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {group.slots.map((slot) => {
                  const remaining = Math.max(0, slot.capacity - slot.reserved);
                  const isFull = remaining <= 0;
                  const isSelected = selectedSlot?.id === slot.id;

                  return (
                    <button
                      key={slot.id}
                      type="button"
                      disabled={isFull}
                      onClick={() => onSelectSlot(slot)}
                      aria-pressed={isSelected}
                      className={`relative rounded-xl border p-4 text-left transition-all flex flex-col justify-between focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                        isFull
                          ? 'border-slate-200 dark:border-slate-800/60 bg-slate-50/70 dark:bg-slate-900/30 opacity-60 cursor-not-allowed'
                          : isSelected
                          ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/20 dark:border-brand-400 ring-2 ring-brand-500 shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm cursor-pointer'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-1.5 font-medium text-slate-900 dark:text-slate-100 text-sm">
                          <Clock className="w-3.5 h-3.5 text-brand-500" />
                          <span>{formatTimeRange(slot.startTime, slot.endTime)}</span>
                        </div>

                        {isSelected ? (
                          <CheckCircle2 className="w-4 h-4 text-brand-600 dark:text-brand-400 flex-shrink-0" />
                        ) : isFull ? (
                          <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900">
                            Full
                          </span>
                        ) : null}
                      </div>

                      <div className="w-full pt-1">
                        <CapacityBar
                          capacity={slot.capacity}
                          reserved={slot.reserved}
                          compact
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
