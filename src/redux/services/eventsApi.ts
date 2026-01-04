import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const eventsApi = createApi({
  reducerPath: "eventsApi",
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
    getProfileEvents: builder.query<
      any,
      { profileId: string; page?: number; page_size?: number }
    >({
      query: ({ profileId, page = 1, page_size = 10 }) => {
        const params = new URLSearchParams();
        params.set("profile_id", profileId);
        params.set("page", page.toString());
        params.set("page_size", page_size.toString());

        return `/events?${params.toString()}`;
      },
    }),

    getCustomerEvents: builder.query<
      any,
      {
        page?: number;
        page_size?: number;
        event_type?: string;
        event_id?: string;
        campaign_name?: string;
        customer_id?: string;
        email?: string;
        customer_name?: string;
        event_timestamp?: string;
      }
    >({
      query: ({
        page = 1,
        page_size = 10,
        event_type,
        event_id,
        campaign_name,
        customer_id,
        email,
        customer_name,
        event_timestamp,
      }) => {
        const params = new URLSearchParams();
        params.set("page", page.toString());
        params.set("page_size", page_size.toString());
        if (event_type) params.set("event_type", event_type);
        if (event_id) params.set("event_id", event_id);
        if (campaign_name) params.set("campaign_name", campaign_name);
        if (customer_id) params.set("customer_id", customer_id);
        if (email) params.set("email", email);
        if (customer_name) params.set("customer_name", customer_name);
        if (event_timestamp) params.set("event_timestamp", event_timestamp);

        return `customer_events?${params.toString()}`;
      },
    }),
  }),
});

export const {
  useGetProfileEventsQuery,
  useLazyGetProfileEventsQuery,
  useGetCustomerEventsQuery,
} = eventsApi;
