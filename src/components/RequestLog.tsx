import React, { useState } from 'react';
import { RequestLogEntry } from '../api/types';
import { ChevronDown, ChevronUp, Copy, Check, Terminal } from 'lucide-react';

export interface RequestLogProps {
  entry: RequestLogEntry | null;
  defaultExpanded?: boolean;
}

export const RequestLog: React.FC<RequestLogProps> = ({
  entry,
  defaultExpanded = false,
}) => {
  const [isOpen, setIsOpen] = useState(defaultExpanded);
  const [copied, setCopied] = useState(false);

  if (!entry) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(entry, null, 2)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const isSuccess = entry.status >= 200 && entry.status < 300;
  const isClientError = entry.status >= 400 && entry.status < 500;

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden text-xs shadow-sm">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-between gap-3 text-left focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-500"
      >
        <div className="flex items-center gap-2.5 overflow-hidden">
          <Terminal className="w-4 h-4 text-slate-500 flex-shrink-0" />
          <span className="font-semibold text-slate-700 dark:text-slate-200">
            Request details
          </span>
          <span
            className={`font-mono px-2 py-0.5 rounded text-[11px] font-bold ${
              isSuccess
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                : isClientError
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
            }`}
          >
            {entry.status} {entry.statusText}
          </span>
          <span className="text-slate-400 text-[11px] hidden sm:inline font-mono">
            {entry.durationMs}ms
          </span>
        </div>

        <div className="flex items-center gap-2 text-slate-400">
          <span className="text-[11px] font-medium hidden md:inline">
            {isOpen ? 'Hide payload & headers' : 'View payload & headers'}
          </span>
          {isOpen ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </div>
      </button>

      {isOpen && (
        <div className="p-4 space-y-4 border-t border-slate-200 dark:border-slate-800 bg-slate-950 text-slate-100 font-mono text-[11px] overflow-x-auto">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div>
              <span className="text-emerald-400 font-bold mr-2">{entry.method}</span>
              <span className="text-slate-300">{entry.url}</span>
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] transition-colors focus:outline-none"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied' : 'Copy JSON'}</span>
            </button>
          </div>

          {/* Request Headers */}
          <div>
            <div className="text-slate-400 font-semibold mb-1 text-[10px] uppercase tracking-wider">
              Request Headers:
            </div>
            <div className="bg-slate-900 p-2.5 rounded border border-slate-800 space-y-1">
              {Object.entries(entry.requestHeaders).map(([k, v]) => (
                <div key={k} className="flex gap-2">
                  <span className="text-indigo-300 font-semibold">{k}:</span>
                  <span className="text-slate-200 break-all">{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Request Body */}
          {entry.requestBody !== undefined && (
            <div>
              <div className="text-slate-400 font-semibold mb-1 text-[10px] uppercase tracking-wider">
                Request Payload:
              </div>
              <pre className="bg-slate-900 p-2.5 rounded border border-slate-800 text-slate-200 overflow-x-auto">
                {typeof entry.requestBody === 'object'
                  ? JSON.stringify(entry.requestBody, null, 2)
                  : String(entry.requestBody)}
              </pre>
            </div>
          )}

          {/* Response Headers */}
          <div>
            <div className="text-slate-400 font-semibold mb-1 text-[10px] uppercase tracking-wider">
              Response Headers:
            </div>
            <div className="bg-slate-900 p-2.5 rounded border border-slate-800 space-y-1">
              {Object.entries(entry.responseHeaders).length > 0 ? (
                Object.entries(entry.responseHeaders).map(([k, v]) => (
                  <div key={k} className="flex gap-2">
                    <span className="text-indigo-300 font-semibold">{k}:</span>
                    <span className="text-slate-200 break-all">{v}</span>
                  </div>
                ))
              ) : (
                <span className="text-slate-500 italic">None</span>
              )}
            </div>
          </div>

          {/* Response Body */}
          <div>
            <div className="text-slate-400 font-semibold mb-1 text-[10px] uppercase tracking-wider">
              Response Body:
            </div>
            <pre className="bg-slate-900 p-2.5 rounded border border-slate-800 text-slate-200 overflow-x-auto">
              {entry.responseBody !== undefined && entry.responseBody !== null
                ? typeof entry.responseBody === 'object'
                  ? JSON.stringify(entry.responseBody, null, 2)
                  : String(entry.responseBody)
                : 'null'}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
