import { apiRequest, ApiResponse, RequestOptions } from './client';
import { CreateResourceRequest, Page, ResourceResponse } from './types';

export interface ListResourcesParams {
  type?: string;
  page?: number;
  size?: number;
  sort?: string;
}

export async function listResources(
  params: ListResourcesParams = {},
  options?: RequestOptions
): Promise<ApiResponse<Page<ResourceResponse>>> {
  const query = new URLSearchParams();
  if (params.type && params.type.trim()) {
    query.set('type', params.type.trim());
  }
  if (params.page !== undefined) {
    query.set('page', String(params.page));
  }
  if (params.size !== undefined) {
    query.set('size', String(params.size));
  }
  if (params.sort) {
    query.set('sort', params.sort);
  }

  const queryString = query.toString();
  const endpoint = `/api/resources${queryString ? `?${queryString}` : ''}`;
  return apiRequest<Page<ResourceResponse>>(endpoint, options);
}

export async function getResource(
  id: string,
  options?: RequestOptions
): Promise<ApiResponse<ResourceResponse>> {
  return apiRequest<ResourceResponse>(`/api/resources/${id}`, options);
}

export async function createResource(
  request: CreateResourceRequest,
  options?: RequestOptions
): Promise<ApiResponse<ResourceResponse>> {
  return apiRequest<ResourceResponse>('/api/resources', {
    ...options,
    method: 'POST',
    body: JSON.stringify(request),
  });
}
