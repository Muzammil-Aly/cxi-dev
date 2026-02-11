import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "../baseQueryWithReauth";

export const MarketingEventsApi = createApi({
  reducerPath: "MarketingEventsApi",
  baseQuery: baseQueryWithReauth,
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
