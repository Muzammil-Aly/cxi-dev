import toast from "react-hot-toast";
import { SerializedError } from "@reduxjs/toolkit";
import { FetchBaseQueryError } from "@reduxjs/toolkit/query";

/**
 * Type guard to check if error is FetchBaseQueryError
 */
export function isFetchBaseQueryError(
  error: unknown
): error is FetchBaseQueryError {
  return typeof error === "object" && error != null && "status" in error;
}

/**
 * Type guard to check if error is SerializedError
 */
export function isSerializedError(
  error: unknown
): error is SerializedError {
  return (
    typeof error === "object" &&
    error != null &&
    "message" in error &&
    !("status" in error)
  );
}

/**
 * Extract error message from RTK Query error
 */
export function getErrorMessage(error: unknown): string {
  if (isFetchBaseQueryError(error)) {
    // Handle FetchBaseQueryError
    if ("error" in error) {
      return error.error;
    }
    if ("data" in error && typeof error.data === "object" && error.data !== null) {
      const data = error.data as Record<string, any>;
      return data.message || data.error || "An error occurred";
    }
    return `Error: ${error.status}`;
  }

  if (isSerializedError(error)) {
    return error.message || "An error occurred";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "An unknown error occurred";
}

/**
 * Show error toast notification
 */
export function showErrorToast(error: unknown, fallbackMessage?: string): void {
  const message = fallbackMessage || getErrorMessage(error);
  toast.error(message, {
    duration: 4000,
    position: "top-right",
  });
}

/**
 * Show success toast notification
 */
export function showSuccessToast(message: string): void {
  toast.success(message, {
    duration: 3000,
    position: "top-right",
  });
}

/**
 * Show info toast notification
 */
export function showInfoToast(message: string): void {
  toast(message, {
    duration: 3000,
    position: "top-right",
    icon: "ℹ️",
  });
}

/**
 * Handle API error with logging and toast
 */
export function handleApiError(
  error: unknown,
  context?: string,
  showToast: boolean = true
): void {
  const message = getErrorMessage(error);

  // Log error to console for debugging
  console.error(`[API Error${context ? ` - ${context}` : ""}]:`, {
    message,
    error,
  });

  // Show toast notification if enabled
  if (showToast) {
    showErrorToast(error);
  }
}

/**
 * Get HTTP status code from error
 */
export function getErrorStatus(error: unknown): number | undefined {
  if (isFetchBaseQueryError(error)) {
    return typeof error.status === "number" ? error.status : undefined;
  }
  return undefined;
}

/**
 * Check if error is a specific HTTP status
 */
export function isErrorStatus(error: unknown, status: number): boolean {
  return getErrorStatus(error) === status;
}

/**
 * Check if error is authentication error (401)
 */
export function isAuthError(error: unknown): boolean {
  return isErrorStatus(error, 401);
}

/**
 * Check if error is forbidden error (403)
 */
export function isForbiddenError(error: unknown): boolean {
  return isErrorStatus(error, 403);
}

/**
 * Check if error is not found error (404)
 */
export function isNotFoundError(error: unknown): boolean {
  return isErrorStatus(error, 404);
}

/**
 * Check if error is server error (5xx)
 */
export function isServerError(error: unknown): boolean {
  const status = getErrorStatus(error);
  return status !== undefined && status >= 500 && status < 600;
}
