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
  }),
});

export const { useLoginMutation, useRefreshTokenMutation, useGetCxiUsersQuery } =
  authApi;
