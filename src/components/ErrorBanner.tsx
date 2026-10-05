import React, { useState, useEffect } from 'react';
import { ApiError } from '../api/client';
import { AlertCircle, RefreshCw, AlertTriangle, WifiOff } from 'lucide-react';

export interface ErrorBannerProps {
  error: ApiError | null;
  onRetry?: () => void;
  onRefreshAvailability?: () => void;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({
  error,
  onRetry,
  onRefreshAvailability,
}) => {
  const [retryCountdown, setRetryCountdown] = useState<number>(() => error?.retryAfter ?? 0);

  useEffect(() => {
    if (error?.retryAfter && error.retryAfter > 0) {
      setRetryCountdown(error.retryAfter);
      const interval = setInterval(() => {
        setRetryCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setRetryCountdown(0);
    }
  }, [error]);

  if (!error) return null;

  const problem = error.problem;
  const status = error.status;
  const isValidation = status === 400;
  const isConflict = status === 409;
  const isUnprocessable = status === 422;
  const isServiceUnavailable = status === 503;
  const isNetwork = error.isNetworkError;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="rounded-xl border p-4 shadow-sm transition-all border-rose-200 dark:border-rose-900/60 bg-rose-50/80 dark:bg-rose-950/40 text-slate-800 dark:text-slate-200"
    >
      <div className="flex items-start gap-3">
        <div className="p-1 rounded-lg bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 mt-0.5 flex-shrink-0">
          {isNetwork ? (
            <WifiOff className="w-5 h-5" />
          ) : isConflict || isUnprocessable ? (
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex items-baseline justify-between gap-2">
            <h4 className="font-semibold text-rose-900 dark:text-rose-200 text-sm">
              {problem.title || (isNetwork ? 'Connection Error' : 'Request Failed')}
            </h4>
            {status > 0 && (
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 font-medium">
                HTTP {status}
              </span>
            )}
          </div>

          <p className="text-xs text-rose-700 dark:text-rose-300 leading-relaxed">
            {problem.detail ||
              (isConflict
                ? 'The requested capacity on this slot is no longer available. Please select another slot or lower your quantity.'
                : isNetwork
                ? 'Unable to communicate with the server. Please verify your connection or ensure the backend is running.'
                : 'An error occurred while processing your request.')}
          </p>

          {/* Validation Field Errors (400) */}
          {isValidation && problem.errors && Object.keys(problem.errors).length > 0 && (
            <div className="mt-2.5 p-3 rounded-lg bg-white/70 dark:bg-slate-900/60 border border-rose-200 dark:border-rose-900/50 text-xs">
              <span className="font-semibold text-rose-800 dark:text-rose-300 block mb-1">
                Please correct the following:
              </span>
              <ul className="list-disc list-inside space-y-1 text-rose-700 dark:text-rose-400">
                {Object.entries(problem.errors).map(([field, msg]) => (
                  <li key={field}>
                    <strong className="font-mono">{field}</strong>: {msg}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-2 flex flex-wrap items-center gap-2">
            {isConflict && onRefreshAvailability && (
              <button
                type="button"
                onClick={onRefreshAvailability}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-amber-600 hover:bg-amber-700 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh availability
              </button>
            )}

            {(isServiceUnavailable || retryCountdown > 0) && (
              <div className="text-xs font-medium text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                {retryCountdown > 0 ? (
                  <span>
                    Service busy. You can retry in <strong>{retryCountdown}s</strong>…
                  </span>
                ) : (
                  <span>The service should now be responsive again.</span>
                )}
              </div>
            )}

            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                disabled={retryCountdown > 0}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                {retryCountdown > 0 ? `Try again (${retryCountdown}s)` : 'Try again'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
