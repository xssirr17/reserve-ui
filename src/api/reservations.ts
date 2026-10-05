import { apiRequest, ApiResponse, RequestOptions } from './client';
import {
  CreateReservationRequest,
  Page,
  ReservationResponse,
} from './types';

export interface CreateReservationOptions extends RequestOptions {
  idempotencyKey: string;
}

/**
 * Creates a new reservation hold for a slot.
 * Requires an Idempotency-Key header.
 * Returns 201 Created with Location header and ReservationResponse in PENDING status.
 */
export async function createReservation(
  request: CreateReservationRequest,
  options: CreateReservationOptions
): Promise<ApiResponse<ReservationResponse>> {
  const { idempotencyKey, ...fetchOptions } = options;

  if (!idempotencyKey || !idempotencyKey.trim()) {
    throw new Error('Idempotency-Key header is required to create a reservation');
  }

  return apiRequest<ReservationResponse>('/api/reservations', {
    ...fetchOptions,
    method: 'POST',
    headers: {
      ...fetchOptions.headers,
      'Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify(request),
  });
}

export async function getReservation(
  id: string,
  options?: RequestOptions
): Promise<ApiResponse<ReservationResponse>> {
  return apiRequest<ReservationResponse>(`/api/reservations/${id}`, options);
}

export async function listReservations(
  userId: string,
  page?: number,
  size?: number,
  options?: RequestOptions
): Promise<ApiResponse<Page<ReservationResponse>>> {
  const query = new URLSearchParams();
  query.set('userId', userId);
  if (page !== undefined) {
    query.set('page', String(page));
  }
  if (size !== undefined) {
    query.set('size', String(size));
  }
  return apiRequest<Page<ReservationResponse>>(
    `/api/reservations?${query.toString()}`,
    options
  );
}

export async function confirmReservation(
  id: string,
  options?: RequestOptions
): Promise<ApiResponse<ReservationResponse>> {
  return apiRequest<ReservationResponse>(`/api/reservations/${id}/confirm`, {
    ...options,
    method: 'POST',
  });
}

export async function cancelReservation(
  id: string,
  options?: RequestOptions
): Promise<ApiResponse<ReservationResponse>> {
  return apiRequest<ReservationResponse>(`/api/reservations/${id}/cancel`, {
    ...options,
    method: 'POST',
  });
}
