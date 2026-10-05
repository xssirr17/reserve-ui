import React, { useState, useEffect } from 'react';
import { ResourceResponse, SlotResponse, RequestLogEntry } from '../api/types';
import { useCreateReservation } from '../hooks/useCreateReservation';
import { useIdempotencyKey } from '../hooks/useIdempotencyKey';
import { getStoredUserId, setStoredUserId } from '../lib/storage';
import { formatTimeRange, formatLocalDate } from '../lib/format';
import { ErrorBanner } from './ErrorBanner';
import { RequestLog } from './RequestLog';
import { ApiError } from '../api/client';
import { Calendar, User, Hash, Loader2, Send, Key } from 'lucide-react';

export interface ReservationFormProps {
  resource: ResourceResponse;
  slot: SlotResponse;
  onSuccess: (data: {
    reservation: import('../api/types').ReservationResponse;
    slot: SlotResponse;
    logEntry: RequestLogEntry | null;
  }) => void;
  onRefreshAvailability?: () => void;
}

export const ReservationForm: React.FC<ReservationFormProps> = ({
  resource,
  slot,
  onSuccess,
  onRefreshAvailability,
}) => {
  const remainingCapacity = Math.max(0, slot.capacity - slot.reserved);
  const showQuantityInput = remainingCapacity > 1;

  // Persisted user identifier in localStorage
  const [userId, setUserId] = useState<string>(() => getStoredUserId() || 'user-demo-1');
  const [quantity, setQuantity] = useState<number>(1);
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
  const [lastLogEntry, setLastLogEntry] = useState<RequestLogEntry | null>(null);

  // Synchronize localStorage whenever userId changes
  useEffect(() => {
    setStoredUserId(userId);
  }, [userId]);

  // Adjust quantity if capacity changed or slot switched
  useEffect(() => {
    setQuantity(1);
    setClientErrors({});
  }, [slot.id]);

  // Idempotency key hook: tracks attempt inputs (slotId, userId, quantity)
  // Reuses the same key across retries if inputs remain unchanged!
  const { key: idempotencyKey } = useIdempotencyKey({
    slotId: slot.id,
    userId: userId.trim(),
    quantity,
  });

  const reservationMutation = useCreateReservation();

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    const trimmedUser = userId.trim();

    if (!trimmedUser) {
      errors.userId = 'User Name / ID is required.';
    } else if (trimmedUser.length > 255) {
      errors.userId = 'User Name / ID cannot exceed 255 characters.';
    }

    if (showQuantityInput) {
      if (!quantity || isNaN(quantity)) {
        errors.quantity = 'Quantity is required.';
      } else if (quantity < 1) {
        errors.quantity = 'Quantity must be at least 1.';
      } else if (quantity > remainingCapacity) {
        errors.quantity = `Quantity cannot exceed remaining capacity (${remainingCapacity}).`;
      } else if (quantity > 10000) {
        errors.quantity = 'Quantity cannot exceed 10,000.';
      }
    }

    setClientErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const response = await reservationMutation.mutateAsync({
        request: {
          slotId: slot.id,
          userId: userId.trim(),
          quantity: showQuantityInput ? quantity : 1,
        },
        idempotencyKey,
        onLog: (entry) => setLastLogEntry(entry),
      });

      onSuccess({
        reservation: response.data,
        slot,
        logEntry: lastLogEntry,
      });
    } catch {
      // Errors are handled via reservationMutation.error and ErrorBanner
    }
  };

  const handleRetry = () => {
    if (!validate()) return;
    reservationMutation.mutate({
      request: {
        slotId: slot.id,
        userId: userId.trim(),
        quantity: showQuantityInput ? quantity : 1,
      },
      idempotencyKey,
      onLog: (entry) => setLastLogEntry(entry),
    });
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 md:p-6 shadow-sm space-y-6">
      <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          Confirm Reservation Details
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Review the selected slot and submit your reservation hold.
        </p>
      </div>

      {/* Selected Slot Summary */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div>
          <span className="text-slate-500 dark:text-slate-400 block mb-0.5">Resource</span>
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            {resource.name}
          </span>
          <span className="ml-2 uppercase text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
            {resource.type}
          </span>
        </div>

        <div>
          <span className="text-slate-500 dark:text-slate-400 block mb-0.5">Slot Date &amp; Time</span>
          <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-slate-100">
            <Calendar className="w-3.5 h-3.5 text-brand-500" />
            <span>
              {formatLocalDate(slot.startTime)} • {formatTimeRange(slot.startTime, slot.endTime)}
            </span>
          </div>
        </div>
      </div>

      {/* Booking Form */}
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* User Name / ID Input */}
        <div>
          <label
            htmlFor="user-id"
            className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
          >
            User Name / Identifier <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <User className="w-4 h-4" />
            </div>
            <input
              id="user-id"
              type="text"
              required
              value={userId}
              onChange={(e) => {
                setUserId(e.target.value);
                if (clientErrors.userId) {
                  setClientErrors((prev) => ({ ...prev, userId: '' }));
                }
              }}
              placeholder="e.g. user-alice-42"
              className={`w-full text-xs rounded-lg pl-9 pr-3 py-2 border bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                clientErrors.userId
                  ? 'border-rose-300 dark:border-rose-700'
                  : 'border-slate-300 dark:border-slate-700'
              }`}
            />
          </div>
          {clientErrors.userId ? (
            <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-400">
              {clientErrors.userId}
            </p>
          ) : (
            <p className="mt-1 text-[11px] text-slate-400">
              Generic user identifier passed to the backend (saved locally for convenience).
            </p>
          )}
        </div>

        {/* Quantity (Only if remaining capacity > 1) */}
        {showQuantityInput && (
          <div>
            <div className="flex justify-between items-center mb-1">
              <label
                htmlFor="quantity"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                Quantity (Units) <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Max available: <strong>{remainingCapacity}</strong>
              </span>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Hash className="w-4 h-4" />
              </div>
              <input
                id="quantity"
                type="number"
                min={1}
                max={remainingCapacity}
                value={quantity}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setQuantity(isNaN(val) ? 1 : val);
                  if (clientErrors.quantity) {
                    setClientErrors((prev) => ({ ...prev, quantity: '' }));
                  }
                }}
                className={`w-full text-xs rounded-lg pl-9 pr-3 py-2 border bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                  clientErrors.quantity
                    ? 'border-rose-300 dark:border-rose-700'
                    : 'border-slate-300 dark:border-slate-700'
                }`}
              />
            </div>
            {clientErrors.quantity && (
              <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-400">
                {clientErrors.quantity}
              </p>
            )}
          </div>
        )}

        {/* Idempotency Key preview indicator */}
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-mono bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-800">
          <Key className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
          <span className="truncate">
            Idempotency-Key: <span className="text-slate-700 dark:text-slate-300 font-semibold">{idempotencyKey}</span>
          </span>
        </div>

        {/* Error State Banner */}
        {reservationMutation.isError && (
          <ErrorBanner
            error={reservationMutation.error as ApiError}
            onRetry={handleRetry}
            onRefreshAvailability={onRefreshAvailability}
          />
        )}

        {/* Submit Actions */}
        <div className="pt-2 flex items-center justify-end gap-3">
          <button
            type="submit"
            disabled={reservationMutation.isPending || remainingCapacity <= 0}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-xs text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
          >
            {reservationMutation.isPending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Reserving…</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Reserve Now</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Collapsible Request Details panel on failure or in-flight */}
      {lastLogEntry && !reservationMutation.isSuccess && (
        <div className="pt-2">
          <RequestLog entry={lastLogEntry} defaultExpanded={false} />
        </div>
      )}
    </div>
  );
};
