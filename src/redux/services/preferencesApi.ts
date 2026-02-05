import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAccessToken } from "@/utils/auth";
import { preconnect } from "react-dom";

export const PreferencesApi = createApi({
  reducerPath: "PreferencesApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_BASE_URL,
    prepareHeaders: (headers) => {
      const jwtToken = getAccessToken();
      if (jwtToken) {
        headers.set("Authorization", `Bearer ${jwtToken}`);
      } else {
        const token = process.env.NEXT_PUBLIC_DATABRICKS_PAT;
        if (token) {
          headers.set("Authorization", `Bearer ${token}`);
        }
      }
      headers.set("Content-Type", "application/json");
      return headers;
    },
  }),

  tagTypes: ["FilterPreferences"],

  endpoints: (builder) => ({
    // ✅ Fetch user filter preferences
    // getFilterPreferences: builder.query({
    //   query: ({ user_id, endpoint }) => ({
    //     url: "/filter_preference_view",

    //     params: { user_id, endpoint },
    //   }),
    //   providesTags: ["FilterPreferences"],
    // }),
    getFilterPreferences: builder.query({
      query: ({ user_id, endpoint }) => {
        // Build query params
        const searchParams = new URLSearchParams();
        searchParams.set("page_size", "100");
        if (user_id) searchParams.set("user_id", user_id);
        if (endpoint) searchParams.set("endpoint", endpoint);

        return {
          url: `/filter_preference_view?${searchParams.toString()}`,
          method: "GET",
        };
      },
      providesTags: ["FilterPreferences"],
    }),

    // ✅ Update user filter preferences
    updateFilterPreferences: builder.mutation({
      query: (body) => ({
        url: "/preferences/update_filter_preference",
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["FilterPreferences"],
    }),
  }),
});

export const {
  useGetFilterPreferencesQuery,
  useUpdateFilterPreferencesMutation,
} = PreferencesApi;
