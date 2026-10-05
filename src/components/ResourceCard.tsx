import React from 'react';
import { ResourceResponse } from '../api/types';
import { MetadataList } from './MetadataList';
import { Calendar, ChevronRight } from 'lucide-react';

export interface ResourceCardProps {
  resource: ResourceResponse;
  isSelected: boolean;
  onSelect: (resource: ResourceResponse) => void;
}

export const ResourceCard: React.FC<ResourceCardProps> = ({
  resource,
  isSelected,
  onSelect,
}) => {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(resource)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(resource);
        }
      }}
      aria-pressed={isSelected}
      className={`group relative rounded-xl border p-5 transition-all text-left flex flex-col justify-between cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${
        isSelected
          ? 'border-brand-500 bg-brand-50/40 dark:bg-brand-950/20 dark:border-brand-400 ring-1 ring-brand-500 shadow-sm'
          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm'
      }`}
    >
      <div>
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-base leading-snug group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
            {resource.name}
          </h3>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold tracking-wide uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700/60">
            {resource.type}
          </span>
        </div>

        {resource.metadata && Object.keys(resource.metadata).length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
            <MetadataList metadata={resource.metadata} />
          </div>
        )}
      </div>

      <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs font-medium">
        <span className="inline-flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>View Availability</span>
        </span>
        <span
          className={`inline-flex items-center gap-1 transition-colors ${
            isSelected
              ? 'text-brand-600 dark:text-brand-400 font-semibold'
              : 'text-slate-400 group-hover:text-brand-600 dark:group-hover:text-brand-400'
          }`}
        >
          {isSelected ? 'Selected' : 'Select'}
          <ChevronRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </div>
  );
};
