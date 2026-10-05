import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createReservation } from '../api/reservations';
import {
  CreateReservationRequest,
  RequestLogEntry,
  ReservationResponse,
} from '../api/types';
import { ApiError, ApiResponse } from '../api/client';

export interface CreateReservationVariables {
  request: CreateReservationRequest;
  idempotencyKey: string;
  onLog?: (entry: RequestLogEntry) => void;
}

export function useCreateReservation() {
  const queryClient = useQueryClient();

  return useMutation<
    ApiResponse<ReservationResponse>,
    ApiError,
    CreateReservationVariables
  >({
    mutationFn: async ({ request, idempotencyKey, onLog }) => {
      return createReservation(request, {
        idempotencyKey,
        onLog,
      });
    },
    onSuccess: () => {
      // Invalidate availability so slot remaining capacity updates in real time
      queryClient.invalidateQueries({ queryKey: ['availability'] });
    },
    onError: (error) => {
      // If 409 Conflict occurred (e.g. slot capacity was taken by another user),
      // refresh availability immediately so the user sees current capacity
      if (error.status === 409) {
        queryClient.invalidateQueries({ queryKey: ['availability'] });
      }
    },
  });
}
