import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "../baseQueryWithReauth";

export const customerApi = createApi({
  reducerPath: "customerApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["UserPreferences"],
  endpoints: (builder) => ({
    getProfiles: builder.query<
      any,
      {
        page?: number;
        page_size?: number;
        email?: string;
        phone?: string;
        full_name?: string;
        source?: string;
        join_type?: string;
        customer_id?: string;
        key?: string;
        created_at?: string;
        last_order_date?: string;
        tab?: string;
      }
    >({
      query: ({
        page = 1,
        page_size = 10,
        email,
        phone,
        full_name,
        source,
        join_type,
        customer_id,
        key,
        created_at,
        last_order_date,
        tab,
      }) => {
        const params = new URLSearchParams();
        params.set("page", page.toString());
        params.set("page_size", page_size.toString());
        if (email) params.set("email", email);
        if (phone) params.set("phone", phone);
        if (full_name) params.set("full_name", full_name);
        if (source) params.set("source", source);
        if (customer_id) params.set("customer_id", customer_id);
        if (join_type) params.set("join_type", join_type);
        if (key) params.set("key", key);
        if (created_at) params.set("created_at", created_at);
        if (last_order_date) params.set("last_order_date", last_order_date);
        if (tab) params.set("tab", tab);
        // made changes for webapp
        return `/customer_profiles?${params.toString()}`;
      },
    }),

    getCustomerSegment: builder.query<any, { custId: string; source?: string }>(
      {
        query: ({ custId, source }) =>
          `customer_segments?cust_id=${custId}${source ? `&source=${source}` : ""}`,
      },
    ),

    getSegments: builder.query<any, { page?: number; page_size?: number }>({
      query: ({ page, page_size } = {}) => {
        return `/segments?page=${page}&page_size=${page_size}`;
      },
    }),

    getFullNames: builder.query<any, string | void>({
      query: (name = "") => ({
        url: "/customer/full-names",
        params: name ? { name } : {},
      }),
    }),

    getPhone: builder.query<any, string | void>({
      query: (name = "") => ({
        url: "/customer/phone",
        params: name ? { name } : {},
      }),
    }),

    getOrderHistory: builder.query<any, { profileId: string }>({
      query: ({ profileId }) => {
        return `/order_history?profile_id=${profileId}`;
      },
    }),

    getZendeskTickets: builder.query<any, { email?: string }>({
      query: ({ email }) => `/zendesk_tickets?email=${email}`,
    }),

    //   getUserPreferences: builder.query<
    //     any[],
    //     { endpoint?: string; user_id?: string } | void
    //   >({
    //     query: (params) => {
    //       const searchParams = new URLSearchParams();

    //       if (params?.endpoint) searchParams.set("endpoint", params.endpoint);
    //       if (params?.user_id) searchParams.set("user_id", params.user_id);

    //       const queryString = searchParams.toString();
    //       return `/user_prefernce_view${queryString ? `?${queryString}` : ""}`;
    //     },
    //   }),
    // }),
    getUserPreferences: builder.query<
      any[],
      { endpoint?: string; user_id?: string } | void
    >({
      query: (params) => {
        const searchParams = new URLSearchParams();

        // Fixed page size
        searchParams.set("page_size", "100");

        if (params?.endpoint) searchParams.set("endpoint", params.endpoint);
        if (params?.user_id) searchParams.set("user_id", params.user_id);

        const queryString = searchParams.toString();
        return `/user_prefernce_view${queryString ? `?${queryString}` : ""}`;
      },
      providesTags: (result, error, arg) => [
        "UserPreferences",
        { type: "UserPreferences" as const, id: arg?.endpoint || "all" },
      ],
    }),

    upsertUserPreferences: builder.mutation<any, { data: any[] }>({
      query: (body) => ({
        url: "/preferences/upsert",
        method: "PATCH",
        body,
      }),
      // Invalidate UserPreferences cache to ensure all components get fresh data
      // Extract endpoint from first data item to invalidate specific cache
      invalidatesTags: (result, error, arg) => {
        const endpoint = arg.data[0]?.endpoint;
        return [
          "UserPreferences",
          { type: "UserPreferences" as const, id: endpoint || "all" },
        ];
      },
    }),
  }),
});

export const {
  useGetProfilesQuery,
  useGetCustomerSegmentQuery,
  useGetSegmentsQuery,
  useGetFullNamesQuery,
  useGetPhoneQuery,
  useGetOrderHistoryQuery,
  useGetZendeskTicketsQuery,
  useGetUserPreferencesQuery,
  useUpsertUserPreferencesMutation,
} = customerApi;
