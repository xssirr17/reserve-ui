import React, { useState } from 'react';

export interface MetadataListProps {
  metadata: Record<string, unknown> | null | undefined;
  maxInitialItems?: number;
}

const TRUNCATE_LENGTH = 60;

const MetadataValue: React.FC<{ value: unknown }> = ({ value }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (value === null || value === undefined) {
    return <span className="italic text-slate-400 dark:text-slate-500">null</span>;
  }

  if (typeof value === 'boolean') {
    return (
      <span
        className={`inline-block px-1.5 py-0.5 text-[11px] font-mono rounded ${
          value
            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
        }`}
      >
        {value ? 'true' : 'false'}
      </span>
    );
  }

  if (typeof value === 'number') {
    return <span className="font-mono text-slate-800 dark:text-slate-200">{value}</span>;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="italic text-slate-400 dark:text-slate-500">[empty]</span>;
    }
    return (
      <div className="flex flex-wrap gap-1 mt-0.5">
        {value.map((item, idx) => (
          <span
            key={idx}
            className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
          >
            {typeof item === 'object' && item !== null ? JSON.stringify(item) : String(item)}
          </span>
        ))}
      </div>
    );
  }

  if (typeof value === 'object') {
    return (
      <pre className="text-[11px] font-mono bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 p-1.5 rounded border border-slate-200 dark:border-slate-800 overflow-x-auto max-w-full">
        {JSON.stringify(value, null, 2)}
      </pre>
    );
  }

  const str = String(value);
  if (str.length > TRUNCATE_LENGTH) {
    return (
      <span className="text-slate-700 dark:text-slate-300 break-words">
        {isExpanded ? str : `${str.slice(0, TRUNCATE_LENGTH)}…`}
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="ml-1 text-[11px] text-brand-600 dark:text-brand-400 hover:underline focus:outline-none"
        >
          {isExpanded ? 'Show less' : 'Show more'}
        </button>
      </span>
    );
  }

  return <span className="text-slate-700 dark:text-slate-300 break-words">{str}</span>;
};

export const MetadataList: React.FC<MetadataListProps> = ({
  metadata,
  maxInitialItems = 6,
}) => {
  const [showAll, setShowAll] = useState(false);

  if (!metadata || typeof metadata !== 'object' || Object.keys(metadata).length === 0) {
    return null;
  }

  const entries = Object.entries(metadata);
  const visibleEntries = showAll ? entries : entries.slice(0, maxInitialItems);
  const remainingCount = entries.length - visibleEntries.length;

  return (
    <div className="space-y-1.5 text-xs">
      <div className="grid grid-cols-1 gap-1.5">
        {visibleEntries.map(([key, val]) => (
          <div
            key={key}
            className="flex flex-col sm:flex-row sm:items-baseline justify-between py-1 border-b border-slate-100 dark:border-slate-800/80 last:border-0 gap-1"
          >
            <span className="font-medium text-slate-500 dark:text-slate-400 capitalize break-all sm:w-1/3">
              {key}
            </span>
            <div className="sm:w-2/3 text-left sm:text-right">
              <MetadataValue value={val} />
            </div>
          </div>
        ))}
      </div>

      {entries.length > maxInitialItems && (
        <button
          type="button"
          onClick={() => setShowAll(!showAll)}
          className="text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline pt-1 focus:outline-none"
        >
          {showAll ? 'Collapse metadata' : `+${remainingCount} more attributes`}
        </button>
      )}
    </div>
  );
};
