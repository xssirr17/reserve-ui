import { ProblemDetail, RequestLogEntry } from './types';

export class ApiError extends Error {
  public readonly status: number;
  public readonly problem: ProblemDetail;
  public readonly headers: Record<string, string>;
  public readonly retryAfter?: number;
  public readonly isNetworkError: boolean;

  constructor(
    problem: ProblemDetail,
    status: number,
    headers: Record<string, string> = {},
    retryAfter?: number,
    isNetworkError = false
  ) {
    super(problem.detail || problem.title || `API error with status ${status}`);
    this.name = 'ApiError';
    this.problem = problem;
    this.status = status;
    this.headers = headers;
    this.retryAfter = retryAfter;
    this.isNetworkError = isNetworkError;
  }
}

/**
 * Normalizes any error payload or HTTP error status into an RFC 7807 ProblemDetail object.
 */
export function parseProblemDetail(
  body: unknown,
  status: number,
  statusText = ''
): ProblemDetail {
  if (body && typeof body === 'object') {
    const raw = body as Record<string, unknown>;
    const title = typeof raw.title === 'string' ? raw.title : statusText || `Error ${status}`;
    const detail = typeof raw.detail === 'string' ? raw.detail : undefined;
    const type = typeof raw.type === 'string' ? raw.type : undefined;
    const instance = typeof raw.instance === 'string' ? raw.instance : undefined;
    const timestamp = typeof raw.timestamp === 'string' ? raw.timestamp : undefined;

    const problem: ProblemDetail = {
      title,
      status: typeof raw.status === 'number' ? raw.status : status,
      detail,
      type,
      instance,
      timestamp,
      ...raw,
    };

    if (raw.errors && typeof raw.errors === 'object') {
      problem.errors = raw.errors as Record<string, string>;
    }

    return problem;
  }

  return {
    title: statusText || `Error ${status}`,
    status,
    detail: typeof body === 'string' && body.trim() ? body : undefined,
  };
}

export interface RequestOptions extends RequestInit {
  onLog?: (entry: RequestLogEntry) => void;
}

export interface ApiResponse<T> {
  data: T;
  headers: Record<string, string>;
  status: number;
  statusText: string;
}

const getApiBaseUrl = (): string => {
  return (import.meta.env.VITE_API_BASE_URL || '').trim();
};

/**
 * Lightweight, strictly-typed fetch wrapper without axios.
 * Handles dev-server proxy, Problem Details RFC 7807 parsing, and request logging.
 */
export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const { onLog, ...fetchOptions } = options;
  const baseUrl = getApiBaseUrl();
  const url = path.startsWith('http://') || path.startsWith('https://')
    ? path
    : `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;

  const method = fetchOptions.method || 'GET';
  const startTime = performance.now();
  const timestamp = new Date().toISOString();

  // Normalize request headers
  const reqHeaders: Record<string, string> = {};
  if (fetchOptions.headers) {
    if (fetchOptions.headers instanceof Headers) {
      fetchOptions.headers.forEach((val, key) => {
        reqHeaders[key.toLowerCase()] = val;
      });
    } else if (Array.isArray(fetchOptions.headers)) {
      fetchOptions.headers.forEach(([k, v]) => {
        reqHeaders[k.toLowerCase()] = v;
      });
    } else {
      Object.entries(fetchOptions.headers).forEach(([k, v]) => {
        reqHeaders[k.toLowerCase()] = String(v);
      });
    }
  }

  // Ensure JSON content type when body is present and not specified
  if (fetchOptions.body && !reqHeaders['content-type']) {
    reqHeaders['content-type'] = 'application/json';
  }

  let rawBody: unknown = undefined;
  if (typeof fetchOptions.body === 'string') {
    try {
      rawBody = JSON.parse(fetchOptions.body);
    } catch {
      rawBody = fetchOptions.body;
    }
  }

  try {
    const res = await fetch(url, {
      ...fetchOptions,
      headers: reqHeaders,
    });

    const durationMs = Math.round(performance.now() - startTime);

    const resHeaders: Record<string, string> = {};
    res.headers.forEach((value, key) => {
      resHeaders[key.toLowerCase()] = value;
    });

    // Parse Retry-After header if present
    const retryAfterHeader = res.headers.get('retry-after');
    const retryAfter = retryAfterHeader ? parseInt(retryAfterHeader, 10) : undefined;

    let parsedBody: unknown = null;
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('json')) {
      try {
        parsedBody = await res.json();
      } catch {
        parsedBody = null;
      }
    } else {
      try {
        parsedBody = await res.text();
      } catch {
        parsedBody = null;
      }
    }

    if (onLog) {
      onLog({
        url,
        method,
        requestHeaders: reqHeaders,
        requestBody: rawBody,
        status: res.status,
        statusText: res.statusText,
        responseHeaders: resHeaders,
        responseBody: parsedBody,
        durationMs,
        timestamp,
      });
    }

    if (!res.ok) {
      const problem = parseProblemDetail(parsedBody, res.status, res.statusText);
      throw new ApiError(problem, res.status, resHeaders, isNaN(Number(retryAfter)) ? undefined : retryAfter);
    }

    return {
      data: parsedBody as T,
      headers: resHeaders,
      status: res.status,
      statusText: res.statusText,
    };
  } catch (err: unknown) {
    if (err instanceof ApiError) {
      throw err;
    }

    const durationMs = Math.round(performance.now() - startTime);
    const networkProblem: ProblemDetail = {
      title: 'Network Connection Failed',
      status: 0,
      detail:
        err instanceof Error && err.message
          ? err.message
          : 'Unable to connect to the backend server. Please verify the service is running and reachable.',
      timestamp: new Date().toISOString(),
    };

    if (onLog) {
      onLog({
        url,
        method,
        requestHeaders: reqHeaders,
        requestBody: rawBody,
        status: 0,
        statusText: 'Network Error',
        responseHeaders: {},
        responseBody: networkProblem,
        durationMs,
        timestamp,
      });
    }

    throw new ApiError(networkProblem, 0, {}, undefined, true);
  }
}
