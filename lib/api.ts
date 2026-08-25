/**
 * Global fetch-based client for making API requests.
 *
 * - Set auth with `setApiAuthToken(token)`; it injects the Authorization header.
 * - Parses JSON automatically; for 204 responses `data` is `null`.
 * - Returns `{ data, status, statusText, headers }`.
 * - On non-2xx, throws an Error with `status` and `data`.
 *
 * @example
 * import { api } from '@/lib/api';
 *
 * const createThing = async () => {
 *   const { data } = await api.post('/api/your-endpoint', { data: 'your data' });
 *   console.log(data);
 * };
 *
 * await api.get('/api/users');
 * await api.put('/api/user/123', { name: 'Updated' });
 * await api.delete('/api/user/123');
 */

type FetchResponse<T> = {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
};

export interface ApiError<T = unknown> extends Error {
  status: number;
  data: T;
}

let authToken: string | null = null;

const defaultHeaders: Record<string, string> = {
  "Content-Type": "application/json",
};

const request = async <T = any>(
  url: string,
  init: RequestInit = {}
): Promise<FetchResponse<T>> => {
  const headers: Record<string, string> = {
    ...defaultHeaders,
    ...(authToken ? { Authorization: authToken } : {}),
    ...(init.headers as Record<string, string> | undefined),
  };

  const response = await fetch(url, {
    credentials: "include",
    ...init,
    headers,
  });

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const data =
    response.status === 204
      ? null
      : isJson
      ? await response.json()
      : await response.text();

  if (!response.ok) {
    const error = new Error(
      (isJson && data && typeof data === "object" && "error" in data && typeof (data as { error?: string }).error === "string"
        ? (data as { error: string }).error
        : response.statusText) || "Request failed"
    ) as ApiError<T>;
    error.status = response.status;
    error.data = data as T;
    throw error;
  }

  return {
    data: data as T,
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  };
};

export const api = {
  get: <T = any>(url: string, init?: RequestInit) =>
    request<T>(url, { ...init, method: "GET" }),

  delete: <T = any>(url: string, init?: RequestInit) =>
    request<T>(url, { ...init, method: "DELETE" }),

  post: <T = any>(url: string, body?: any, init?: RequestInit) =>
    request<T>(url, {
      ...init,
      method: "POST",
      body: body === undefined ? init?.body : JSON.stringify(body),
    }),

  put: <T = any>(url: string, body?: any, init?: RequestInit) =>
    request<T>(url, {
      ...init,
      method: "PUT",
      body: body === undefined ? init?.body : JSON.stringify(body),
    }),

  patch: <T = any>(url: string, body?: any, init?: RequestInit) =>
    request<T>(url, {
      ...init,
      method: "PATCH",
      body: body === undefined ? init?.body : JSON.stringify(body),
    }),
};

export const setApiAuthToken = (token: string | null) => {
  if (!token) {
    authToken = null;
    return;
  }
  authToken = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
};
