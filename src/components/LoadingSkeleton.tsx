import React from 'react';

export const ResourceCardSkeleton: React.FC = () => (
  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 animate-pulse">
    <div className="flex items-start justify-between gap-3">
      <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-2/3" />
      <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-16" />
    </div>
    <div className="space-y-2 pt-2">
      <div className="h-3 bg-slate-100 dark:bg-slate-800/60 rounded w-full" />
      <div className="h-3 bg-slate-100 dark:bg-slate-800/60 rounded w-4/5" />
    </div>
    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between">
      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-24" />
      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-16" />
    </div>
  </div>
);

export const ResourceGridSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <ResourceCardSkeleton key={i} />
    ))}
  </div>
);
