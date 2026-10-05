import { apiRequest, ApiResponse, RequestOptions } from './client';
import { ActuatorHealthResponse } from './types';

export async function getActuatorHealth(
  options?: RequestOptions
): Promise<ApiResponse<ActuatorHealthResponse>> {
  return apiRequest<ActuatorHealthResponse>('/actuator/health', options);
}
