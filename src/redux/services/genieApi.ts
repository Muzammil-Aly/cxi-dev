import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "../baseQueryWithReauth";

export const genieApi = createApi({
  reducerPath: "genieApi",
  baseQuery: baseQueryWithReauth,
  endpoints: (builder) => ({
    startConversation: builder.mutation<any, { content: string }>({
      query: (body) => ({
        url: "/genie/start-conversation",
        method: "POST",
        body,
      }),
    }),
    sendMessage: builder.mutation<
      any,
      { conversationId: string; content: string }
    >({
      query: ({ conversationId, content }) => ({
        url: `/genie/conversations/${conversationId}/messages`,
        method: "POST",
        body: { content },
      }),
    }),
    getMyConversations: builder.query<
      { conversations: { conversation_id: string; title: string; created_timestamp: number }[] },
      void
    >({
      query: () => "/genie/conversations",
    }),
    getConversationMessages: builder.query<any, string>({
      query: (conversationId) =>
        `/genie/conversations/${conversationId}/messages`,
    }),
  }),
});

export const {
  useStartConversationMutation,
  useSendMessageMutation,
  useGetMyConversationsQuery,
  useLazyGetConversationMessagesQuery,
} = genieApi;
