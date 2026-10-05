import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { getAvailability, GetAvailabilityParams } from '../api/slots';
import { Page, SlotResponse } from '../api/types';
import { ApiError } from '../api/client';

export function useAvailability(
  resourceId?: string,
  params?: GetAvailabilityParams
) {
  return useQuery<Page<SlotResponse>, ApiError>({
    queryKey: ['availability', resourceId, params],
    queryFn: async () => {
      if (!resourceId || !params?.from || !params?.to) {
        throw new Error('Resource ID and time range are required to query availability');
      }
      const res = await getAvailability(resourceId, params);
      return res.data;
    },
    enabled: Boolean(resourceId && params?.from && params?.to),
    placeholderData: keepPreviousData,
    staleTime: 10_000,
  });
}
