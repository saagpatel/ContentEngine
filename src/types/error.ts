/**
 * Error codes for structured error responses from backend
 */
export enum ErrorCode {
  // Content errors
  CONTENT_TOO_SHORT = 'CONTENT_TOO_SHORT',
  CONTENT_TOO_LONG = 'CONTENT_TOO_LONG',
  INVALID_URL = 'INVALID_URL',
  FETCH_TIMEOUT = 'FETCH_TIMEOUT',
  NOT_FOUND = 'NOT_FOUND',

  // API errors
  INVALID_KEY = 'INVALID_KEY',
  API_RATE_LIMITED = 'API_RATE_LIMITED',
  API_ERROR = 'API_ERROR',
  USAGE_LIMIT_EXCEEDED = 'USAGE_LIMIT_EXCEEDED',

  // Voice errors
  INVALID_SAMPLES = 'INVALID_SAMPLES',
  INVALID_VOICE = 'INVALID_VOICE',

  // DB/System errors
  DB_ERROR = 'DB_ERROR',
  KEYRING_ERROR = 'KEYRING_ERROR',
  EXPORT_ERROR = 'EXPORT_ERROR',

  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
}

/**
 * Structured error detail from backend
 */
export interface ErrorDetail {
  code: ErrorCode;
  message: string;
  details?: Record<string, any>;
  retry_after?: number; // seconds
}

/**
 * Error response wrapper
 */
export interface ApiError {
  success: false;
  error: ErrorDetail;
}

/**
 * Success response wrapper
 */
export interface ApiSuccess<T> {
  success: true;
  data: T;
}

/**
 * Union type for all API responses
 */
export type ApiResponse<T> = ApiSuccess<T> | ApiError;

/**
 * Check if response is an error
 */
export function isApiError<T>(response: ApiResponse<T>): response is ApiError {
  return !response.success;
}

/**
 * Get user-friendly error message
 */
export function getErrorMessage(error: ErrorDetail): string {
  const prefix = error.code.replace(/_/g, ' ').toLowerCase();
  return `${prefix}: ${error.message}`;
}
