/**
 * BetterBee — API Client.
 *
 * Centralized HTTP client for backend communication.
 * Automatically injects Clerk auth tokens and normalizes errors.
 */

import axios, { type AxiosError, type AxiosInstance, type AxiosRequestConfig } from "axios";

/**
 * Resolve API base URL dynamically.
 * If running on a non-localhost hostname (e.g. yuviii.online or Vercel) and NEXT_PUBLIC_API_URL
 * was not set during build, it safely falls back to the live Render backend.
 */
export function getApiBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl && envUrl.trim() && !envUrl.includes("localhost") && !envUrl.includes("127.0.0.1")) {
    return envUrl.trim().replace(/\/+$/, "");
  }
  if (typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
    return "https://betterbee.onrender.com";
  }
  if (envUrl && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, "");
  }
  return "http://localhost:8000";
}

export const API_BASE_URL = getApiBaseUrl();

/**
 * Create a configured Axios instance for the BetterBee API.
 * Auth token injection is handled per-request via getAuthToken parameter.
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  timeout: 120000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Runtime interceptor ensuring non-localhost hosts always target the live production backend
apiClient.interceptors.request.use((config) => {
  const resolvedBase = getApiBaseUrl();
  config.baseURL = `${resolvedBase}/api/v1`;
  return config;
});

/**
 * Normalized API error shape for consistent error handling.
 */
export interface ApiError {
  type: string;
  message: string;
  detail?: unknown;
  status: number;
}

/**
 * Extract a structured error from an Axios error response.
 */
export function parseApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ error?: { type?: string; message?: string; detail?: unknown } }>;
    const data = axiosError.response?.data;
    return {
      type: data?.error?.type || "UnknownError",
      message: data?.error?.message || axiosError.message || "An unexpected error occurred",
      detail: data?.error?.detail,
      status: axiosError.response?.status || 500,
    };
  }

  return {
    type: "NetworkError",
    message: error instanceof Error ? error.message : "An unexpected error occurred",
    status: 0,
  };
}

/**
 * Make an authenticated API request.
 * Injects the Clerk token into the Authorization header.
 */
export async function authenticatedRequest<T>(
  config: AxiosRequestConfig,
  getToken: () => Promise<string | null>,
): Promise<T> {
  const token = await getToken();
  const response = await apiClient.request<T>({
    ...config,
    headers: {
      ...config.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  return response.data;
}
