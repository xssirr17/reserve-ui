import React from 'react';
import { APP_TITLE } from '../lib/constants';
import { useBackendHealth } from '../hooks/useBackendHealth';
import { getUserTimeZone } from '../lib/format';
import { Layers, Globe, Activity } from 'lucide-react';

export const Header: React.FC = () => {
  const { isConnected, isLoading, statusText } = useBackendHealth();
  const timeZone = getUserTimeZone();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Branding */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-600 text-white flex items-center justify-center shadow-md shadow-brand-500/20">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-tight">
              {APP_TITLE}
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Generic Resource &amp; Capacity Reservation Microservice
            </p>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center gap-3">
          {/* Time Zone Badge */}
          <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700">
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-medium">{timeZone}</span>
          </div>

          {/* Backend Connection Health Badge */}
          <div
            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              isConnected
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
                : isLoading
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60'
            }`}
            title={`Backend Health Check: ${statusText}`}
          >
            <span className="relative flex h-2 w-2">
              {isConnected && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              )}
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  isConnected ? 'bg-emerald-500' : isLoading ? 'bg-slate-400' : 'bg-rose-500'
                }`}
              />
            </span>
            <Activity className="w-3.5 h-3.5 opacity-60 hidden md:inline" />
            <span className="text-[11px]">
              Backend: {isConnected ? 'connected' : isLoading ? 'connecting…' : 'unreachable'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
