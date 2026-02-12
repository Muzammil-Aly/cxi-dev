import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "../baseQueryWithReauth";

export const supportApi = createApi({
  reducerPath: "supportApi",
  baseQuery: baseQueryWithReauth,
  endpoints: (builder) => ({
    getSupportTickets: builder.query<
      any,
      {
        page?: number;
        page_size?: number;
        ticket_id?: string;
        customer_id?: string;
        customer_name?: string;
        phone_no?: string;
        email?: string;
        status?: string;
        tags?: string;
        created_at?: string;
        source?: string;
      }
    >({
      query: ({
        page = 1,
        page_size = 10,
        customer_id,
        ticket_id,
        customer_name,
        phone_no,
        email,
        status,
        tags,
        created_at,
        source,
      }) => {
        const params = new URLSearchParams();
        params.set("page", page.toString());
        params.set("page_size", page_size.toString());
        if (source) params.set("source", source);
        if (customer_id) params.set("customer_id", customer_id);
        if (ticket_id) params.set("ticket_id", ticket_id);
        if (customer_name) params.set("customer_name", customer_name);
        if (phone_no) params.set("phone_no", phone_no);
        if (email) params.set("email", email);
        if (status) params.set("status", status);
        if (tags) params.set("tags", tags);
        if (created_at) params.set("created_at", created_at);
        return `/support_tickets?${params.toString()}`;
      },
    }),

    getSupportTicketsComments: builder.query<
      any,
      {
        customerId?: number;
        ticketId?: number;
        page?: number;
        page_size?: number;
        source?: string;
      }
    >({
      query: ({ customerId, ticketId, page = 1, page_size = 50, source }) => {
        const queryParams: string[] = [];
        if (customerId) queryParams.push(`customer_id=${customerId}`);
        if (ticketId) queryParams.push(`ticket_id=${ticketId}`);

        queryParams.push(`page=${page}`);
        queryParams.push(`page_size=${page_size}`);
        if (source) queryParams.push(`source=${source}`);

        return `support_ticket_comments?${queryParams.join("&")}`;
      },
    }),
  }),
});

export const {
  useGetSupportTicketsQuery,
  useGetSupportTicketsCommentsQuery,
} = supportApi;
