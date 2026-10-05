import React from 'react';
import { ReservationResponse, SlotResponse, RequestLogEntry } from '../api/types';
import { useCountdown } from '../hooks/useCountdown';
import { formatLocalDateTime, formatTimeRange } from '../lib/format';
import { RequestLog } from './RequestLog';
import { CheckCircle2, Clock, Copy, Check, ArrowRight, ShieldCheck } from 'lucide-react';

export interface ReservationResultProps {
  reservation: ReservationResponse;
  slot?: SlotResponse | null;
  logEntry: RequestLogEntry | null;
  onNewBooking: () => void;
}

export const ReservationResult: React.FC<ReservationResultProps> = ({
  reservation,
  slot,
  logEntry,
  onNewBooking,
}) => {
  const [copiedId, setCopiedId] = React.useState(false);
  const countdown = useCountdown(reservation.expiresAt);

  const handleCopyId = () => {
    navigator.clipboard.writeText(reservation.id).then(() => {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    });
  };

  const isExpiringSoon = !countdown.isExpired && countdown.totalRemainingSeconds < 120;

  return (
    <div className="space-y-6">
      {/* Main Success Card */}
      <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800/80 bg-white dark:bg-slate-900 p-6 md:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Reservation Created
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Capacity has been reserved and held in <strong>PENDING</strong> state.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              {reservation.status}
            </span>
          </div>
        </div>

        {/* Expiry Countdown Banner */}
        <div
          className={`mt-6 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border transition-colors ${
            countdown.isExpired
              ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200'
              : isExpiringSoon
              ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-200'
              : 'bg-brand-50/60 dark:bg-brand-950/30 border-brand-200 dark:border-brand-800 text-brand-900 dark:text-brand-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 flex-shrink-0" />
            <div>
              <span className="font-semibold text-xs uppercase tracking-wide block">
                {countdown.isExpired ? 'Hold Window Expired' : 'Hold Expiration Countdown'}
              </span>
              <span className="text-xs opacity-90">
                {countdown.isExpired
                  ? 'This temporary reservation hold has expired.'
                  : `Held until ${formatLocalDateTime(reservation.expiresAt)}`}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="font-mono text-2xl font-bold tracking-tight">
              {countdown.isExpired ? '00:00' : countdown.formattedTime}
            </span>
            <span className="text-xs opacity-75">remaining</span>
          </div>
        </div>

        {/* Reservation Details Grid */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-2">
            <div className="text-slate-500 dark:text-slate-400 font-medium">Reservation ID</div>
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono font-semibold text-slate-900 dark:text-slate-100 break-all">
                {reservation.id}
              </span>
              <button
                type="button"
                onClick={handleCopyId}
                className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors flex-shrink-0 focus:outline-none"
                title="Copy Reservation ID"
              >
                {copiedId ? (
                  <Check className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-2">
            <div className="text-slate-500 dark:text-slate-400 font-medium">Reserved By (User ID)</div>
            <div className="font-mono font-semibold text-slate-900 dark:text-slate-100">
              {reservation.userId}
            </div>
          </div>

          {slot && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-2">
              <div className="text-slate-500 dark:text-slate-400 font-medium">Slot Time Window</div>
              <div className="font-semibold text-slate-900 dark:text-slate-100">
                {formatTimeRange(slot.startTime, slot.endTime)}
              </div>
            </div>
          )}

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-2">
            <div className="text-slate-500 dark:text-slate-400 font-medium">Quantity Reserved</div>
            <div className="font-semibold text-slate-900 dark:text-slate-100">
              {reservation.quantity} {reservation.quantity === 1 ? 'unit' : 'units'}
            </div>
          </div>
        </div>

        {/* Idempotent safety note */}
        <div className="mt-6 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
          <span>
            This reservation was registered with an Idempotency-Key. Repeated requests with the same key replay this exact response without double-booking.
          </span>
        </div>

        {/* Action Button */}
        <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onNewBooking}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-xs text-white bg-brand-600 hover:bg-brand-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
          >
            <span>Book another slot</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Collapsible Raw Request Log Panel */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          API Audit &amp; Diagnostics
        </h3>
        <RequestLog entry={logEntry} defaultExpanded={false} />
      </div>
    </div>
  );
};
