/**
 * Types and contracts for Reserve Service microservice.
 * Strictly mirrors the Spring Boot backend DTOs and models.
 */

export interface Page<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      empty: boolean;
      sorted: boolean;
      unsorted: boolean;
    };
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  totalElements: number;
  totalPages: number;
  last: boolean;
  first: boolean;
  size: number;
  number: number;
  numberOfElements: number;
  sort: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
  empty: boolean;
}

export interface ResourceResponse {
  id: string; // UUID
  name: string;
  type: string;
  metadata: Record<string, unknown>;
  createdAt: string; // ISO-8601 UTC
  updatedAt: string; // ISO-8601 UTC
}

export interface CreateResourceRequest {
  name: string;
  type: string;
  metadata: Record<string, unknown>;
}

export interface SlotResponse {
  id: string; // UUID
  resourceId: string; // UUID
  startTime: string; // ISO-8601 UTC
  endTime: string; // ISO-8601 UTC
  capacity: number;
  reserved: number;
  createdAt: string; // ISO-8601 UTC
}

export interface CreateSlotRequest {
  startTime: string; // ISO-8601 UTC
  endTime: string; // ISO-8601 UTC
  capacity: number;
}

export type ReservationStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'COMPLETED';

export interface ReservationResponse {
  id: string; // UUID
  slotId: string; // UUID
  userId: string;
  quantity: number;
  status: ReservationStatus;
  expiresAt: string; // ISO-8601 UTC
  createdAt: string; // ISO-8601 UTC
  updatedAt: string; // ISO-8601 UTC
}

export interface CreateReservationRequest {
  slotId: string; // UUID
  userId: string;
  quantity: number;
}

/**
 * RFC 7807 Problem Details representation returned by Spring GlobalExceptionHandler
 */
export interface ProblemDetail {
  type?: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  timestamp?: string;
  errors?: Record<string, string>; // Validation field errors
  slotId?: string;
  requested?: number;
  available?: number;
  currentStatus?: string;
  targetStatus?: string;
  parameter?: string;
  header?: string;
  [key: string]: unknown;
}

export interface ActuatorHealthResponse {
  status: 'UP' | 'DOWN' | 'OUT_OF_SERVICE' | 'UNKNOWN';
  components?: Record<string, unknown>;
}

export interface RequestLogEntry {
  url: string;
  method: string;
  requestHeaders: Record<string, string>;
  requestBody?: unknown;
  status: number;
  statusText: string;
  responseHeaders: Record<string, string>;
  responseBody?: unknown;
  durationMs: number;
  timestamp: string;
}
