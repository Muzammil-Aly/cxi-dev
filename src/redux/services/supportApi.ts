import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAccessToken } from "@/utils/auth";

export const supportApi = createApi({
  reducerPath: "supportApi",
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
      }) => {
        const params = new URLSearchParams();
        params.set("page", page.toString());
        params.set("page_size", page_size.toString());
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
      }
    >({
      query: ({ customerId, ticketId, page = 1, page_size = 50 }) => {
        const queryParams: string[] = [];
        if (customerId) queryParams.push(`customer_id=${customerId}`);
        if (ticketId) queryParams.push(`ticket_id=${ticketId}`);

        queryParams.push(`page=${page}`);
        queryParams.push(`page_size=${page_size}`);

        return `support_ticket_comments?${queryParams.join("&")}`;
      },
    }),
  }),
});

export const {
  useGetSupportTicketsQuery,
  useGetSupportTicketsCommentsQuery,
} = supportApi;
