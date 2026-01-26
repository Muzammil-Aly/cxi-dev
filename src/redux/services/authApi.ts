import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAccessToken } from "@/utils/auth";

interface User {
  user_id: string;
  user_name: string;
  email: string;
  password: string;
}

interface CxiUsersResponse {
  data: User[];
  total_records: number;
  current_page: number;
  page_size: number;
  total_pages: number;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  status: number;
  system_status: number;
  data: {
    access_token: string;
    refresh_token: string;
    token_type: string;
    user_id: string;
    user_name: string;
    email: string;
  };
  message: string;
  system_error_message: string;
}
interface LogoutRequest {
  refresh_token: string;
}

interface LogoutResponse {
  status: number;
  message: string;
}

interface RefreshTokenRequest {
  refresh_token: string;
}

interface RefreshTokenResponse {
  status: number;
  system_status: number;
  data: {
    access_token: string;
    refresh_token: string;
    token_type: string;
  };
  message: string;
  system_error_message: string;
}

interface UserActivityRecord {
  id: string;
  user_id: string;
  session_id: string | null;
  activity_type: "LOGIN_SUCCESS" | "LOGOUT" | "LOGIN_FAILED";
  failure_reason: string | null;
  ip_address: string;
  user_agent: string;
  issued_at: string | null;
  expires_at: string | null;
  revoked: boolean | null;
  created_at: string;
}

interface UserActivityResponse {
  status: number;
  system_status: number;
  data: {
    records: UserActivityRecord[];
    pagination: {
      previous_page: number | null;
      current_page: number;
      next_page: number | null;
      total_pages: number;
      total_items: number;
    };
  };
  message: string;
  system_error_message: string;
}

interface UserActivityRequest {
  user_id: string;
  activity_type?: string;
  created_from?: string;
  created_to?: string;
  page?: number;
  page_size?: number;
}

interface UserInteractionRecord {
  id: string;
  user_id: string;
  session_id: string;
  endpoint: string;
  http_method: string;
  query_params: string;
  request_body: string;
  request_headers: string;
  response_status: number;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

interface UserInteractionResponse {
  status: number;
  system_status: number;
  data: {
    records: UserInteractionRecord[];
    pagination: {
      previous_page: number | null;
      current_page: number;
      next_page: number | null;
      total_pages: number;
      total_items: number;
    };
  };
  message: string;
  system_error_message: string;
}

interface UserInteractionRequest {
  user_id: string;
  endpoint?: string;
  http_method?: string;
  created_from?: string;
  created_to?: string;
  page?: number;
  page_size?: number;
}

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: fetchBaseQuery({
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
  }),
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (credentials) => ({
        url: "/auth/login",
        method: "POST",
        body: credentials,
      }),
    }),
    logout: builder.mutation<LogoutResponse, LogoutRequest>({
      query: (credentials) => ({
        url: "/auth/logout",
        method: "POST",
        body: credentials,
      }),
    }),
    refreshToken: builder.mutation<RefreshTokenResponse, RefreshTokenRequest>({
      query: (body) => ({
        url: "/auth/refresh",
        method: "POST",
        body,
      }),
    }),
    getCxiUsers: builder.query<CxiUsersResponse, void>({
      query: () => `/cxi_users?page_size=100`,
    }),
    getUserActivity: builder.query<UserActivityResponse, UserActivityRequest>({
      query: ({ user_id, activity_type, created_from, created_to, page = 1, page_size = 10 }) => {
        const params = new URLSearchParams();
        params.append("user_id", user_id);
        if (activity_type) params.append("activity_type", activity_type);
        if (created_from) params.append("created_from", created_from);
        if (created_to) params.append("created_to", created_to);
        params.append("page", page.toString());
        params.append("page_size", page_size.toString());
        return `/tracking/user_activity?${params.toString()}`;
      },
    }),
    getUserInteraction: builder.query<UserInteractionResponse, UserInteractionRequest>({
      query: ({ user_id, endpoint, http_method, created_from, created_to, page = 1, page_size = 10 }) => {
        const params = new URLSearchParams();
        params.append("user_id", user_id);
        if (endpoint) params.append("endpoint", endpoint);
        if (http_method) params.append("http_method", http_method);
        if (created_from) params.append("created_from", created_from);
        if (created_to) params.append("created_to", created_to);
        params.append("page", page.toString());
        params.append("page_size", page_size.toString());
        return `/tracking/user_interaction?${params.toString()}`;
      },
    }),
  }),
});

export const {
  useLoginMutation,
  useLogoutMutation,
  useRefreshTokenMutation,
  useGetCxiUsersQuery,
  useGetUserActivityQuery,
  useGetUserInteractionQuery,
} = authApi;
