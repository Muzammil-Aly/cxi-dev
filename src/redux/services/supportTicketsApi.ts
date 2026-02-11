import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "../baseQueryWithReauth";

export const supportTicketsApi = createApi({
  reducerPath: "supportTicketsApi",
  baseQuery: baseQueryWithReauth,
  endpoints: (builder) => ({
    getTicketCustomerNames: builder.query<any, string | void>({
      query: (name = "") => ({
        url: "/tickets/customer-names",
        params: name ? { name } : {},
      }),
    }),

    getTicketPhones: builder.query<any, string | void>({
      query: (name = "") => ({
        url: "/tickets/phones",
        params: name ? { name } : {},
      }),
    }),

    getTicketTags: builder.query<any, string | void>({
      query: (name = "") => ({
        url: "/tickets/tags",
        params: name ? { name } : {},
      }),
    }),
  }),
});

export const {
  useGetTicketCustomerNamesQuery,
  useGetTicketPhonesQuery,
  useGetTicketTagsQuery,
} = supportTicketsApi;
