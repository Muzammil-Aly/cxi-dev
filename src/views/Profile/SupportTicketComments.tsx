"use client";

import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Chip,
  CircularProgress,
  Box,
  Alert,
} from "@mui/material";
import { useGetSupportTicketsCommnetsQuery } from "@/redux/services/profileApi";
import Loader from "@/components/Common/Loader";

interface CommentProps {
  comment_id: number;
  ticket_id: number;
  customer_id: string;
  author_id: number;
  created_at: string;
  body: string;
  ispublic: boolean;
  parent_theme: string;
  child_theme_cluster_name: string;
}

interface SupportTicketCommentsProps {
  // customerId: string;
  ticketId?: string;
  filters?: any;
}

const SupportTicketComments: React.FC<SupportTicketCommentsProps> = ({
  ticketId,
}) => {
  // const numericCustId = parseInt(String(customerId).replace(/\D/g, ""), 10);
  const numericTicketId = ticketId
    ? parseInt(String(ticketId).replace(/\D/g, ""), 10)
    : undefined;

  const { data, error, isLoading, isFetching } =
    useGetSupportTicketsCommnetsQuery(
      // { customerId: numericCustId },
      // { skip: !customerId }

      { ticketId: numericTicketId, page_size: 50, source: "Support Tickets" },
      { skip: !ticketId }
    );

  if (isLoading || isFetching) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={2}>
        <Loader />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">Failed to load comments</Alert>;
  }

  const comments: CommentProps[] = Array.isArray(data)
    ? data
    : Array.isArray(data?.comments)
    ? data.comments
    : Array.isArray(data?.data)
    ? data.data
    : [];

  if (comments.length === 0) {
    return (
      <Alert className="drag-handle" severity="info">
        No comments found
      </Alert>
    );
  }

  // sort comments by created_at descending
  const sortedComments = [...comments].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <Box display="flex" flexDirection="column" gap={2}>
      <Typography
        variant="subtitle2"
        fontWeight={600}
        mb={1}
        className="drag-handle"
      >
        Ticket ID: {ticketId}
      </Typography>
      {isFetching ? (
        <Box display="flex" justifyContent="center" alignItems="center" p={2}>
          <Loader />
        </Box>
      ) : (
        sortedComments.map((comment) => (
          <Card
            key={comment.comment_id}
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            <CardContent>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="start"
              >
                <Box>
                  <Typography variant="subtitle2" fontWeight="bold">
                    Author ID: {comment.author_id}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Ticket #{comment.ticket_id} — Customer #
                    {comment.customer_id}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.disabled"
                    display="block"
                  >
                    {new Date(comment.created_at).toLocaleString()}
                  </Typography>
                </Box>
                <Chip
                  size="small"
                  label={comment.ispublic ? "Public" : "Internal"}
                  color={comment.ispublic ? "success" : "default"}
                  variant="outlined"
                />
              </Box>

              <Typography
                variant="body2"
                sx={{ whiteSpace: "pre-wrap", mt: 2 }}
              >
                {comment.body}
              </Typography>

              <Box display="flex" gap={1} mt={2}>
                <Chip
                  label={comment.parent_theme}
                  size="small"
                  color="primary"
                />
                <Chip
                  label={comment.child_theme_cluster_name}
                  size="small"
                  color="secondary"
                />
              </Box>
            </CardContent>
          </Card>
        ))
      )}
    </Box>
  );
};

export default SupportTicketComments;
