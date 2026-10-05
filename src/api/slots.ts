import { apiRequest, ApiResponse, RequestOptions } from './client';
import { CreateSlotRequest, Page, SlotResponse } from './types';

export interface GetAvailabilityParams {
  from: string; // ISO-8601 UTC Instant
  to: string; // ISO-8601 UTC Instant
  page?: number;
  size?: number;
  sort?: string;
}

export async function getAvailability(
  resourceId: string,
  params: GetAvailabilityParams,
  options?: RequestOptions
): Promise<ApiResponse<Page<SlotResponse>>> {
  const query = new URLSearchParams();
  query.set('from', params.from);
  query.set('to', params.to);
  if (params.page !== undefined) {
    query.set('page', String(params.page));
  }
  if (params.size !== undefined) {
    query.set('size', String(params.size));
  }
  if (params.sort) {
    query.set('sort', params.sort);
  }

  const endpoint = `/api/resources/${resourceId}/availability?${query.toString()}`;
  return apiRequest<Page<SlotResponse>>(endpoint, options);
}

export async function createSlot(
  resourceId: string,
  request: CreateSlotRequest,
  options?: RequestOptions
): Promise<ApiResponse<SlotResponse>> {
  return apiRequest<SlotResponse>(`/api/resources/${resourceId}/slots`, {
    ...options,
    method: 'POST',
    body: JSON.stringify(request),
  });
}
