import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { listResources, ListResourcesParams } from '../api/resources';
import { Page, ResourceResponse } from '../api/types';
import { ApiError } from '../api/client';

export function useResources(params: ListResourcesParams = {}) {
  return useQuery<Page<ResourceResponse>, ApiError>({
    queryKey: ['resources', params],
    queryFn: async () => {
      const res = await listResources(params);
      return res.data;
    },
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}
