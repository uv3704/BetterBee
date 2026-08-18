/**
 * BetterBee — API Client.
 *
 * Centralized HTTP client for backend communication.
 * Automatically injects Clerk auth tokens and normalizes errors.
 */

import axios, { type AxiosError, type AxiosInstance, type AxiosRequestConfig } from "axios";

const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
export const API_BASE_URL = RAW_API_URL.replace(/\/+$/, "");

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
