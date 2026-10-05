import { useQuery } from '@tanstack/react-query';
import { getActuatorHealth } from '../api/health';
import { ActuatorHealthResponse } from '../api/types';
import { ApiError } from '../api/client';

export function useBackendHealth() {
  const query = useQuery<ActuatorHealthResponse, ApiError>({
    queryKey: ['actuator', 'health'],
    queryFn: async () => {
      const res = await getActuatorHealth();
      return res.data;
    },
    refetchInterval: 15_000,
    retry: 1,
    staleTime: 10_000,
  });

  const isConnected = query.isSuccess && query.data?.status === 'UP';

  return {
    ...query,
    isConnected,
    statusText: query.data?.status || (query.isError ? 'UNREACHABLE' : 'CHECKING'),
  };
}
