import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

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

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_BASE_URL,
    prepareHeaders: (headers) => {
      const token = process.env.NEXT_PUBLIC_DATABRICKS_PAT;
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      headers.set("Content-Type", "application/json");
      return headers;
    },
  }),
  endpoints: (builder) => ({
    getCxiUsers: builder.query<CxiUsersResponse, void>({
      // query: () => "/cxi_users",
      query: () => `/cxi_users?page_size=100`,
    }),
  }),
});

export const { useGetCxiUsersQuery } = authApi;
