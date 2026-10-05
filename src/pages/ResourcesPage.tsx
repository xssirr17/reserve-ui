import React, { useState } from 'react';
import {
  ResourceResponse,
  SlotResponse,
  ReservationResponse,
  RequestLogEntry,
} from '../api/types';
import { useResources } from '../hooks/useResources';
import { ResourceCard } from '../components/ResourceCard';
import { SlotPicker } from '../components/SlotPicker';
import { ReservationForm } from '../components/ReservationForm';
import { ReservationResult } from '../components/ReservationResult';
import { ResourceGridSkeleton } from '../components/LoadingSkeleton';
import { DEFAULT_PAGE_SIZE } from '../lib/constants';
import {
  Filter,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Box,
  ArrowLeft,
} from 'lucide-react';

export const ResourcesPage: React.FC = () => {
  // Query parameters state
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [appliedType, setAppliedType] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(0);

  // Selection states
  const [selectedResource, setSelectedResource] = useState<ResourceResponse | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<SlotResponse | null>(null);

  // Active reservation result state
  const [successfulReservation, setSuccessfulReservation] = useState<{
    reservation: ReservationResponse;
    slot: SlotResponse;
    logEntry: RequestLogEntry | null;
  } | null>(null);

  const {
    data: pageData,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useResources({
    type: appliedType || undefined,
    page: currentPage,
    size: DEFAULT_PAGE_SIZE,
  });

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedType(typeFilter.trim());
    setCurrentPage(0);
  };

  const handleClearFilter = () => {
    setTypeFilter('');
    setAppliedType('');
    setCurrentPage(0);
  };

  const handleSelectResource = (resource: ResourceResponse) => {
    setSelectedResource(resource);
    setSelectedSlot(null);
    setSuccessfulReservation(null);
  };

  const handleBackToResources = () => {
    setSelectedResource(null);
    setSelectedSlot(null);
    setSuccessfulReservation(null);
  };

  const handleReservationSuccess = (data: {
    reservation: ReservationResponse;
    slot: SlotResponse;
    logEntry: RequestLogEntry | null;
  }) => {
    setSuccessfulReservation(data);
  };

  const handleNewBooking = () => {
    setSuccessfulReservation(null);
    setSelectedSlot(null);
  };

  return (
    <div className="space-y-8">
      {/* If a reservation was just completed, display the result view */}
      {successfulReservation ? (
        <div>
          <button
            type="button"
            onClick={handleNewBooking}
            className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline focus:outline-none"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to available slots</span>
          </button>
          <ReservationResult
            reservation={successfulReservation.reservation}
            slot={successfulReservation.slot}
            logEntry={successfulReservation.logEntry}
            onNewBooking={handleNewBooking}
          />
        </div>
      ) : selectedResource ? (
        /* Resource Detail: Availability & Booking View */
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleBackToResources}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline focus:outline-none"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to all resources</span>
            </button>

            <span className="text-xs text-slate-500 dark:text-slate-400">
              Active Resource: <strong className="text-slate-800 dark:text-slate-200">{selectedResource.name}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Slot Picker Column */}
            <div className={selectedSlot ? 'lg:col-span-7 space-y-6' : 'lg:col-span-12 space-y-6'}>
              <SlotPicker
                resource={selectedResource}
                selectedSlot={selectedSlot}
                onSelectSlot={(slot) => setSelectedSlot(slot)}
              />
            </div>

            {/* Booking Form Column (appears when a slot is chosen) */}
            {selectedSlot && (
              <div className="lg:col-span-5 sticky top-20">
                <ReservationForm
                  resource={selectedResource}
                  slot={selectedSlot}
                  onSuccess={handleReservationSuccess}
                  onRefreshAvailability={() => {
                    // Availability will auto-refresh via TanStack Query invalidation
                  }}
                />
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Resource List View */
        <div className="space-y-6">
          {/* Header & Filter Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Resources
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Browse any generic bookable resources. Click a card to view slot availability.
              </p>
            </div>

            {/* Search/Filter by Type */}
            <form onSubmit={handleFilterSubmit} className="flex items-center gap-2">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Filter className="w-3.5 h-3.5" />
                </div>
                <input
                  type="text"
                  placeholder="Filter by type (e.g. ROOM)…"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="text-xs rounded-xl pl-8 pr-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <button
                type="submit"
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                Filter
              </button>

              {appliedType && (
                <button
                  type="button"
                  onClick={handleClearFilter}
                  className="px-3 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Clear
                </button>
              )}

              <button
                type="button"
                onClick={() => refetch()}
                disabled={isFetching}
                className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none"
                title="Refresh list"
              >
                <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
              </button>
            </form>
          </div>

          {/* Resources Grid */}
          {isLoading ? (
            <ResourceGridSkeleton count={6} />
          ) : isError ? (
            <div className="rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 p-8 text-center">
              <h3 className="text-sm font-semibold text-rose-800 dark:text-rose-200">
                {error?.problem?.title || 'Failed to load resources'}
              </h3>
              <p className="text-xs text-rose-600 dark:text-rose-400 mt-1 max-w-md mx-auto">
                {error?.problem?.detail || 'An unexpected error occurred while communicating with the service.'}
              </p>
              <button
                type="button"
                onClick={() => refetch()}
                className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-rose-600 hover:bg-rose-700 transition-colors focus:outline-none"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry
              </button>
            </div>
          ) : !pageData || pageData.content.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-12 text-center">
              <Box className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                No resources yet
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                {appliedType
                  ? `No resources match the type filter "${appliedType}".`
                  : 'No resources have been registered in the database yet. Run the seed demo data script to populate sample items.'}
              </p>
              {appliedType ? (
                <button
                  type="button"
                  onClick={handleClearFilter}
                  className="mt-4 px-3 py-1.5 rounded-lg text-xs font-medium text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-800 hover:bg-brand-50 dark:hover:bg-brand-950/40 transition-colors"
                >
                  Clear filter
                </button>
              ) : null}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {pageData.content.map((resource) => (
                  <ResourceCard
                    key={resource.id}
                    resource={resource}
                    isSelected={false}
                    onSelect={handleSelectResource}
                  />
                ))}
              </div>

              {/* Spring Pagination Controls */}
              {pageData.totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200 dark:border-slate-800 text-xs">
                  <span className="text-slate-500 dark:text-slate-400">
                    Showing page <strong>{pageData.number + 1}</strong> of{' '}
                    <strong>{pageData.totalPages}</strong> ({pageData.totalElements} total resources)
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={pageData.first}
                      onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      Previous
                    </button>

                    <button
                      type="button"
                      disabled={pageData.last}
                      onClick={() => setCurrentPage((p) => p + 1)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      Next
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
