import {
  BaseQueryFn,
  FetchArgs,
  fetchBaseQuery,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query";
import {
  getAccessToken,
  getRefreshToken,
  setAuthTokens,
  clearAuthData,
  shouldRefreshToken,
} from "@/utils/auth";

const baseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL,
  prepareHeaders: (headers) => {
    // Try to get JWT token first
    const jwtToken = getAccessToken();
    if (jwtToken) {
      headers.set("Authorization", `Bearer ${jwtToken}`);
    } else {
      // Fallback to Databricks PAT for backwards compatibility
      const token = process.env.NEXT_PUBLIC_DATABRICKS_PAT;
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
    }
    headers.set("Content-Type", "application/json");
    return headers;
  },
});

let isRefreshing = false;
let refreshPromise: Promise<any> | null = null;

export const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const accessToken = getAccessToken();

  // Check if token needs refresh before making the request
  if (accessToken && shouldRefreshToken(accessToken)) {
    // If already refreshing, wait for that to complete
    if (isRefreshing && refreshPromise) {
      await refreshPromise;
    } else if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = refreshAccessToken();
      await refreshPromise;
      isRefreshing = false;
      refreshPromise = null;
    }
  }

  // Make the original request
  let result = await baseQuery(args, api, extraOptions);

  // If we get a 401, try to refresh the token
  if (result.error && result.error.status === 401) {
    // Prevent multiple simultaneous refresh attempts
    if (isRefreshing && refreshPromise) {
      await refreshPromise;
      // Retry the original request with new token
      result = await baseQuery(args, api, extraOptions);
    } else if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = refreshAccessToken();
      const refreshResult = await refreshPromise;
      isRefreshing = false;
      refreshPromise = null;

      if (refreshResult.success) {
        // Retry the original request with new token
        result = await baseQuery(args, api, extraOptions);
      } else {
        // Refresh failed, clear auth data and redirect to login
        clearAuthData();
        if (typeof window !== "undefined") {
          window.location.href = "/sign-in";
        }
      }
    }
  }

  return result;
};

async function refreshAccessToken(): Promise<{ success: boolean }> {
  try {
    const refreshToken = getRefreshToken();

    if (!refreshToken) {
      return { success: false };
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/auth/refresh`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      }
    );

    if (!response.ok) {
      return { success: false };
    }

    const data = await response.json();

    if (data.status === 200 && data.data) {
      // Update tokens
      setAuthTokens({
        access_token: data.data.access_token,
        refresh_token: data.data.refresh_token,
        token_type: data.data.token_type,
      });
      return { success: true };
    }

    return { success: false };
  } catch (error) {
    console.error("Token refresh failed:", error);
    return { success: false };
  }
}
