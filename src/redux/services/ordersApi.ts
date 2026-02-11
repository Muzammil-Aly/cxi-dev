import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "../baseQueryWithReauth";

export const OrdersApi = createApi({
  reducerPath: "OrdersApi",
  baseQuery: baseQueryWithReauth,
  endpoints: (builder) => ({
    getCustomerNames: builder.query<any, string | void>({
      query: (name = "") => ({
        url: "/orders/customer-names",
        params: name ? { name } : {},
      }),
    }),

    getProfitNames: builder.query<any, string | void>({
      query: (name = "") => ({
        url: "/orders/profit-names",
        params: name ? { name } : {},
      }),
    }),

    getRetailers: builder.query<any, string | void>({
      query: (name = "") => ({
        url: "/orders/retailers",
        params: name ? { name } : {},
      }),
    }),

    getStatuses: builder.query<any, string | void>({
      query: (name = "") => ({
        url: "/orders/statuses",
        params: name ? { name } : {},
      }),
    }),
    // fulfillment-statuses

    getFullfillmentStatuses: builder.query<any, string | void>({
      query: (name = "") => ({
        url: "/orders/fulfillment-statuses",
        params: name ? { name } : {},
      }),
    }),
  }),
});

export const {
  useGetCustomerNamesQuery,
  useGetProfitNamesQuery,
  useGetRetailersQuery,
  useGetStatusesQuery,
  useGetFullfillmentStatusesQuery,
} = OrdersApi;
