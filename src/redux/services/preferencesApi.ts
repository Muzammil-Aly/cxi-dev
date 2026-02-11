import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "../baseQueryWithReauth";

export const PreferencesApi = createApi({
  reducerPath: "PreferencesApi",
  baseQuery: baseQueryWithReauth,

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
