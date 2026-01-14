import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAccessToken } from "@/utils/auth";

export const MarketingEventsApi = createApi({
  reducerPath: "MarketingEventsApi",
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
    getCustomerNames: builder.query<any, string | void>({
      query: (name = "") => ({
        url: "/events/customer-names",
        params: name ? { name } : {},
      }),
    }),
  }),
});

export const { useGetCustomerNamesQuery } = MarketingEventsApi;
