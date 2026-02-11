"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  Chip,
  IconButton,
  CircularProgress,
  Pagination,
  Tooltip,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
} from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";
import CloseIcon from "@mui/icons-material/Close";
import LogoutIcon from "@mui/icons-material/Logout";
import dayjs, { Dayjs } from "dayjs";
import {
  useGetCxiUsersQuery,
  useGetSessionsQuery,
  useGetSessionInteractionsQuery,
} from "@/redux/services/authApi";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import LoginIcon from "@mui/icons-material/Login";
import CustomDateRangePicker from "@/components/Common/DatePicker/CustomDateRangePicker";

interface UserActivityLogProps {
  open: boolean;
  onClose: () => void;
}

// Light theme color scheme (matching the screenshot)
const COLORS = {
  bg: "#F8F6F1",
  bgCard: "#FFFFFF",
  bgHover: "#F5F3EE",
  border: "#E5E5E5",
  textPrimary: "#1A1A1A",
  textSecondary: "#6B7280",
  accent: "#4F46E5",
  accentHover: "#4338CA",
};

const getMethodColor = (method: string) => {
  switch (method.toUpperCase()) {
    case "GET":
      return { bg: "rgba(16, 185, 129, 0.1)", color: "#10b981" };
    case "POST":
      return { bg: "rgba(99, 102, 241, 0.1)", color: "#6366f1" };
    case "PUT":
      return { bg: "rgba(245, 158, 11, 0.1)", color: "#f59e0b" };
    case "DELETE":
      return { bg: "rgba(239, 68, 68, 0.1)", color: "#ef4444" };
    case "PATCH":
      return { bg: "rgba(236, 72, 153, 0.1)", color: "#ec4899" };
    default:
      return { bg: "rgba(107, 114, 128, 0.1)", color: "#6b7280" };
  }
};

const getStatusColor = (status: number) => {
  if (status >= 200 && status < 300) return "#10b981";
  if (status >= 400 && status < 500) return "#f59e0b";
  if (status >= 500) return "#ef4444";
  return "#6366f1";
};

const formatDate = (dateString: string | null) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const parseUserAgent = (ua: string) => {
  if (ua.includes("Chrome") && ua.includes("Edg")) return "Edge";
  if (ua.includes("Chrome")) return "Chrome";
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Safari")) return "Safari";
  if (ua.includes("Postman")) return "Postman";
  return "Unknown Browser";
};

const formatDuration = (minutes: number | null) => {
  if (minutes === null) return "Ongoing";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
};

const truncateSessionId = (sessionId: string) => {
  if (sessionId.length <= 16) return sessionId;
  return `${sessionId.slice(0, 8)}...${sessionId.slice(-8)}`;
};

// const parseQueryParams = (queryParams: string | null) => {
//   if (!queryParams) return { tab: "-", params: "-" };

//   try {
//     // Try JSON format first
//     const parsed = JSON.parse(queryParams);
//     const tab = parsed.source || "-";
//     const entries = Object.entries(parsed)
//       .filter(
//         ([key]) => key !== "source" && key !== "page" && key !== "page_size",
//       )
//       .filter(
//         ([, value]) =>
//           value !== undefined &&
//           value !== null &&
//           value !== "null" &&
//           value !== "",
//       )
//       .map(([key, value]) => `${key}=${value}`);
//     return { tab, params: entries.length > 0 ? entries.join(" | ") : "-" };
//   } catch {
//     // Fallback: URL query string format
//     const decoded = decodeURIComponent(queryParams.replace(/\+/g, " "));
//     const parts = decoded.split("&");
//     let tab = "-";
//     const filtered = parts.filter((param) => {
//       if (param.startsWith("source=") || param.startsWith("tab")) {
//         tab = param.split("=")[1] || "-";
//         return false;
//       }
//       if (param.startsWith("page=") || param.startsWith("page_size="))
//         return false;
//       return true;
//     });
//     return { tab, params: filtered.length > 0 ? filtered.join(" | ") : "-" };
//   }
// };
const parseQueryParams = (queryParams: string | null) => {
  if (!queryParams) return { tab: "-", params: "-" };

  try {
    // Try JSON format first
    const parsed = JSON.parse(queryParams);

    // Pick both tab and source if they exist
    const tabParts: string[] = [];
    if (parsed.tab) tabParts.push(parsed.tab);
    if (parsed.source) tabParts.push(parsed.source);

    const tab = tabParts.length > 0 ? tabParts.join(" / ") : "-";

    const entries = Object.entries(parsed)
      .filter(
        ([key]) =>
          key !== "source" &&
          key !== "tab" &&
          key !== "page" &&
          key !== "page_size",
      )
      .filter(
        ([, value]) =>
          value !== undefined &&
          value !== null &&
          value !== "null" &&
          value !== "",
      )
      .map(([key, value]) => `${key}=${value}`);

    return { tab, params: entries.length > 0 ? entries.join(" | ") : "-" };
  } catch {
    // Fallback: URL query string format
    const decoded = decodeURIComponent(queryParams.replace(/\+/g, " "));
    const parts = decoded.split("&");
    const tabParts: string[] = [];
    const filtered = parts.filter((param) => {
      if (param.startsWith("source=") || param.startsWith("tab=")) {
        const [, value] = param.split("=");
        if (value) tabParts.push(value);
        return false;
      }
      if (param.startsWith("page=") || param.startsWith("page_size="))
        return false;
      return true;
    });
    const tab = tabParts.length > 0 ? tabParts.join(" / ") : "-";
    return { tab, params: filtered.length > 0 ? filtered.join(" | ") : "-" };
  }
};

const SESSION_PAGE_SIZE_OPTIONS = [10, 20, 50];

const UserActivityLog: React.FC<UserActivityLogProps> = ({ open, onClose }) => {
  const currentUserId =
    typeof window !== "undefined" ? localStorage.getItem("userId") || "" : "";
  const [selectedUserId, setSelectedUserId] = useState(currentUserId);

  // Date filters using dayjs (start with no filter)
  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);
  const [dateFilter, setDateFilter] = useState<string | undefined>(undefined);

  // Sessions state
  const [sessionsPage, setSessionsPage] = useState(1);
  const [sessionsPageSize, setSessionsPageSize] = useState(20);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null,
  );
  const [sessionInteractionPage, setSessionInteractionPage] = useState(1);
  const [sessionInteractionPageSize, setSessionInteractionPageSize] =
    useState(50);

  // Fetch all users
  const { data: usersData, isLoading: usersLoading } = useGetCxiUsersQuery(
    undefined,
    {
      skip: !open,
    },
  );

  // Reset selected user when dialog opens
  useEffect(() => {
    if (open && currentUserId) {
      setSelectedUserId(currentUserId);
      // Reset date filter to empty
      setStartDate(null);
      setEndDate(null);
      setDateFilter(undefined);
      // Reset sessions state
      setSessionsPage(1);
      setSelectedSessionId(null);
      setSessionInteractionPage(1);
    }
  }, [open, currentUserId]);

  // Parse date filter for API queries
  const parsedDates = dateFilter?.split(",") || [];
  const dateFrom = parsedDates[0] || undefined;
  const dateTo = parsedDates[1] || undefined;

  // Sessions query
  const {
    data: sessionsData,
    isLoading: sessionsLoading,
    isFetching: sessionsFetching,
  } = useGetSessionsQuery(
    {
      user_id: selectedUserId || "",
      page: sessionsPage,
      page_size: sessionsPageSize,
      date_from: dateFrom,
      date_to: dateTo,
    },
    { skip: !open || !selectedUserId },
  );

  // Session interactions query - when session is clicked
  const {
    data: sessionInteractionsData,
    isLoading: sessionInteractionsLoading,
    isFetching: sessionInteractionsFetching,
  } = useGetSessionInteractionsQuery(
    {
      user_id: selectedUserId || "",
      session_id: selectedSessionId || "",
      page: sessionInteractionPage,
      page_size: sessionInteractionPageSize,
    },
    { skip: !selectedSessionId || !selectedUserId },
  );

  const users = usersData?.data || [];
  const sessions = sessionsData?.data?.sessions || [];
  const totalSessions = sessionsData?.data?.total || 0;
  const totalSessionPages = Math.ceil(totalSessions / sessionsPageSize);
  const sessionInteractions = sessionInteractionsData?.data?.interactions || [];
  const totalSessionInteractions = sessionInteractionsData?.data?.total || 0;
  const totalSessionInteractionPages = Math.ceil(
    totalSessionInteractions / sessionInteractionPageSize,
  );

  const handleUserChange = (userId: string) => {
    setSelectedUserId(userId);
    setSessionsPage(1);
    setSelectedSessionId(null);
    setSessionInteractionPage(1);
  };

  // Handler for resetting pages when date changes (used by CustomDateRangePicker)
  const handleDatePageReset = (page: number) => {
    setSessionsPage(page);
  };

  // Sessions handlers
  const handleSessionClick = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setSessionInteractionPage(1);
  };

  const handleBackToSessions = () => {
    setSelectedSessionId(null);
  };

  const handleSessionsPageSizeChange = (size: number) => {
    setSessionsPageSize(size);
    setSessionsPage(1);
  };

  const handleSessionInteractionPageSizeChange = (size: number) => {
    setSessionInteractionPageSize(size);
    setSessionInteractionPage(1);
  };

  const selectStyles = {
    color: COLORS.textPrimary,
    bgcolor: COLORS.bgCard,
    ".MuiOutlinedInput-notchedOutline": {
      borderColor: COLORS.border,
    },
    "&:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: "#D1D5DB",
    },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: COLORS.accent,
    },
    ".MuiSvgIcon-root": {
      color: COLORS.textSecondary,
    },
  };

  const menuProps = {
    PaperProps: {
      sx: {
        bgcolor: COLORS.bgCard,
        color: COLORS.textPrimary,
        maxHeight: 300,
        boxShadow:
          "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        border: `1px solid ${COLORS.border}`,
      },
    },
  };

  const menuItemStyles = {
    "&:hover": { bgcolor: COLORS.bgHover },
    "&.Mui-selected": { bgcolor: "rgba(79, 70, 229, 0.08)" },
    "&.Mui-selected:hover": { bgcolor: "rgba(79, 70, 229, 0.12)" },
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: COLORS.bg,
          color: COLORS.textPrimary,
          borderRadius: "12px",
          maxHeight: "85vh",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: `1px solid ${COLORS.border}`,
          bgcolor: COLORS.bgCard,
          pb: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          {/* Back button when viewing interactions */}
          {selectedSessionId && (
            <IconButton
              onClick={handleBackToSessions}
              sx={{
                color: COLORS.textSecondary,
                "&:hover": { bgcolor: COLORS.bgHover },
              }}
            >
              <ArrowBackIcon />
            </IconButton>
          )}
          <Box>
            <Typography
              variant="h5"
              sx={{ fontWeight: 700, color: COLORS.textPrimary }}
            >
              {selectedSessionId ? "Session Interactions" : "Activity log"}
            </Typography>
            {selectedSessionId ? (
              <Typography
                sx={{ fontSize: "13px", color: COLORS.textSecondary, mt: 0.5 }}
              >
                Session: {truncateSessionId(selectedSessionId)}
              </Typography>
            ) : (
              selectedUserId && (
                <Typography
                  sx={{
                    fontSize: "13px",
                    color: COLORS.textSecondary,
                    mt: 0.5,
                  }}
                >
                  Viewing:{" "}
                  {users.find((u) => u.user_id === selectedUserId)?.user_name ||
                    selectedUserId}
                </Typography>
              )
            )}
          </Box>
        </Box>
        <IconButton
          onClick={onClose}
          sx={{
            color: COLORS.textSecondary,
            "&:hover": { bgcolor: COLORS.bgHover },
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 0, bgcolor: COLORS.bgCard }}>
        {/* Filters Section */}
        <Box
          sx={{
            p: 2.5,
            borderBottom: `1px solid ${COLORS.border}`,
            bgcolor: COLORS.bgCard,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <FilterListIcon
              sx={{ color: COLORS.textSecondary, fontSize: 20 }}
            />
            <Typography
              sx={{
                fontSize: "14px",
                fontWeight: 600,
                color: COLORS.textPrimary,
              }}
            >
              Filters
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            {/* User Selector */}
            <FormControl size="small" sx={{ minWidth: 200, flex: 1 }}>
              <InputLabel
                id="user-select-label"
                sx={{
                  color: COLORS.textSecondary,
                  "&.Mui-focused": { color: COLORS.accent },
                }}
              >
                Select User
              </InputLabel>
              <Select
                labelId="user-select-label"
                value={selectedUserId}
                label="Select User"
                onChange={(e) => handleUserChange(e.target.value)}
                disabled={usersLoading}
                sx={selectStyles}
                MenuProps={menuProps}
              >
                {users.map((user) => (
                  <MenuItem
                    key={user.user_id}
                    value={user.user_id}
                    sx={menuItemStyles}
                  >
                    <Box>
                      <Typography
                        sx={{
                          fontSize: "14px",
                          fontWeight: 500,
                          color: COLORS.textPrimary,
                        }}
                      >
                        {user.user_name}
                      </Typography>
                      <Typography
                        sx={{ fontSize: "12px", color: COLORS.textSecondary }}
                      >
                        {user.email} ({user.user_id})
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Date Range Picker */}
            <CustomDateRangePicker
              startDate={startDate}
              endDate={endDate}
              setStartDate={setStartDate}
              setEndDate={setEndDate}
              setFilter={setDateFilter}
              setPage={handleDatePageReset}
              width={280}
            />
          </Box>
        </Box>

        {/* Sessions Content */}
        {!selectedSessionId ? (
          // Sessions List View
          <>
            {sessionsLoading || sessionsFetching ? (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  p: 6,
                  bgcolor: COLORS.bgCard,
                }}
              >
                <CircularProgress sx={{ color: COLORS.accent }} size={32} />
              </Box>
            ) : !selectedUserId ? (
              <Box sx={{ textAlign: "center", p: 6, bgcolor: COLORS.bgCard }}>
                <Typography sx={{ color: COLORS.textSecondary }}>
                  Please select a user to view sessions
                </Typography>
              </Box>
            ) : sessions.length === 0 ? (
              <Box sx={{ textAlign: "center", p: 6, bgcolor: COLORS.bgCard }}>
                <Typography sx={{ color: COLORS.textSecondary }}>
                  No sessions found for this user
                </Typography>
              </Box>
            ) : (
              <>
                <Box sx={{ p: 2, bgcolor: COLORS.bgCard }}>
                  {/* Table Header */}
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "200px 180px 180px 100px 120px",
                      gap: 2,
                      px: 2,
                      py: 1.5,
                      borderBottom: `1px solid ${COLORS.border}`,
                      mb: 1,
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: "12px",
                        fontWeight: 600,
                        color: COLORS.textSecondary,
                        textTransform: "uppercase",
                      }}
                    >
                      Session ID
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: "12px",
                        fontWeight: 600,
                        color: COLORS.textSecondary,
                        textTransform: "uppercase",
                      }}
                    >
                      Login Time
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: "12px",
                        fontWeight: 600,
                        color: COLORS.textSecondary,
                        textTransform: "uppercase",
                      }}
                    >
                      Logout Time
                    </Typography>

                    <Typography
                      sx={{
                        fontSize: "12px",
                        fontWeight: 600,
                        color: COLORS.textSecondary,
                        textTransform: "uppercase",
                      }}
                    >
                      Duration
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: "12px",
                        fontWeight: 600,
                        color: COLORS.textSecondary,
                        textTransform: "uppercase",
                      }}
                    >
                      Logout Type
                    </Typography>
                  </Box>

                  {/* Session Rows */}
                  {sessions.map((session) => (
                    <Box
                      key={session.session_id}
                      onClick={() => handleSessionClick(session.session_id)}
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "200px 180px 180px 100px 120px",
                        gap: 2,
                        px: 2,
                        py: 1.5,
                        alignItems: "center",
                        borderRadius: "8px",
                        cursor: "pointer",
                        "&:hover": {
                          bgcolor: COLORS.bgHover,
                        },
                      }}
                    >
                      <Tooltip title={session.session_id} arrow>
                        <Typography
                          sx={{
                            fontSize: "13px",
                            color: COLORS.accent,
                            fontFamily: "monospace",
                            fontWeight: 500,
                          }}
                        >
                          {truncateSessionId(session.session_id)}
                        </Typography>
                      </Tooltip>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <LoginIcon sx={{ color: "#10b981", fontSize: 16 }} />
                        <Typography
                          sx={{ fontSize: "13px", color: COLORS.textSecondary }}
                        >
                          {formatDate(session.login_time)}
                        </Typography>
                      </Box>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        {session.logout_time ? (
                          <>
                            <LogoutIcon
                              sx={{ color: "#f59e0b", fontSize: 16 }}
                            />
                            <Typography
                              sx={{
                                fontSize: "13px",
                                color: COLORS.textSecondary,
                              }}
                            >
                              {formatDate(session.logout_time)}
                            </Typography>
                          </>
                        ) : (
                          <Chip
                            label="Active"
                            size="small"
                            sx={{
                              bgcolor: "rgba(16, 185, 129, 0.1)",
                              color: "#10b981",
                              fontWeight: 600,
                              fontSize: "11px",
                              height: 22,
                            }}
                          />
                        )}
                      </Box>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <AccessTimeIcon
                          sx={{ color: COLORS.textSecondary, fontSize: 16 }}
                        />
                        <Typography
                          sx={{ fontSize: "13px", color: COLORS.textSecondary }}
                        >
                          {formatDuration(session.duration_minutes)}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          fontSize: "13px",
                          color: COLORS.textSecondary,
                          textTransform: "capitalize",
                        }}
                      >
                        {session.logout_type || "-"}
                      </Box>
                    </Box>
                  ))}
                </Box>

                {/* Pagination Footer */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    px: 3,
                    py: 2,
                    borderTop: `1px solid ${COLORS.border}`,
                    bgcolor: COLORS.bgCard,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Typography
                      sx={{ fontSize: "13px", color: COLORS.textSecondary }}
                    >
                      Rows per page
                    </Typography>
                    <Select
                      value={sessionsPageSize}
                      onChange={(e) =>
                        handleSessionsPageSizeChange(e.target.value as number)
                      }
                      size="small"
                      sx={{
                        ...selectStyles,
                        minWidth: 70,
                        ".MuiSelect-select": { py: 0.5, px: 1.5 },
                      }}
                      MenuProps={menuProps}
                    >
                      {SESSION_PAGE_SIZE_OPTIONS.map((size) => (
                        <MenuItem key={size} value={size} sx={menuItemStyles}>
                          {size}
                        </MenuItem>
                      ))}
                    </Select>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Typography
                      sx={{ fontSize: "13px", color: COLORS.textSecondary }}
                    >
                      {(sessionsPage - 1) * sessionsPageSize + 1}-
                      {Math.min(sessionsPage * sessionsPageSize, totalSessions)}{" "}
                      of {totalSessions}
                    </Typography>
                    {totalSessionPages > 1 && (
                      <Pagination
                        count={totalSessionPages}
                        page={sessionsPage}
                        onChange={(_, value) => setSessionsPage(value)}
                        size="small"
                        sx={{
                          "& .MuiPaginationItem-root": {
                            color: COLORS.textSecondary,
                            borderColor: COLORS.border,
                          },
                          "& .Mui-selected": {
                            bgcolor: `${COLORS.accent} !important`,
                            color: "#fff !important",
                          },
                        }}
                      />
                    )}
                  </Box>
                </Box>
              </>
            )}
          </>
        ) : (
          // Session Interactions Detail View
          <>
            {sessionInteractionsLoading || sessionInteractionsFetching ? (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  p: 6,
                  bgcolor: COLORS.bgCard,
                }}
              >
                <CircularProgress sx={{ color: COLORS.accent }} size={32} />
              </Box>
            ) : sessionInteractions.length === 0 ? (
              <Box sx={{ textAlign: "center", p: 6, bgcolor: COLORS.bgCard }}>
                <Typography sx={{ color: COLORS.textSecondary }}>
                  No interactions found for this session
                </Typography>
              </Box>
            ) : (
              <>
                <Box sx={{ p: 2, bgcolor: COLORS.bgCard, overflow: "hidden" }}>
                  {/* Table Header */}
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns:
                        "160px 90px minmax(150px, 1fr) minmax(150px, 1fr)",
                      gap: 2,
                      px: 2,
                      py: 1.5,
                      borderBottom: `1px solid ${COLORS.border}`,
                      mb: 1,
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: "12px",
                        fontWeight: 600,
                        color: COLORS.textSecondary,
                        textTransform: "uppercase",
                      }}
                    >
                      Date and Time
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: "12px",
                        fontWeight: 600,
                        color: COLORS.textSecondary,
                        textTransform: "uppercase",
                      }}
                    >
                      Tab
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: "12px",
                        fontWeight: 600,
                        color: COLORS.textSecondary,
                        textTransform: "uppercase",
                      }}
                    >
                      Endpoint
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: "12px",
                        fontWeight: 600,
                        color: COLORS.textSecondary,
                        textTransform: "uppercase",
                      }}
                    >
                      Query Params
                    </Typography>
                  </Box>

                  {/* Interaction Rows */}
                  {sessionInteractions.map((interaction) => {
                    const { tab, params } = parseQueryParams(
                      interaction.query_params,
                    );
                    return (
                      <Box
                        key={interaction.id}
                        sx={{
                          display: "grid",
                          gridTemplateColumns:
                            "160px 90px minmax(150px, 1fr) minmax(150px, 1fr)",
                          gap: 2,
                          px: 2,
                          py: 1.5,
                          alignItems: "flex-start",
                          borderRadius: "8px",
                          "&:hover": {
                            bgcolor: COLORS.bgHover,
                          },
                        }}
                      >
                        <Typography
                          sx={{ fontSize: "13px", color: COLORS.textSecondary }}
                        >
                          {formatDate(interaction.created_at)}
                        </Typography>
                        <Chip
                          label={tab}
                          size="small"
                          sx={{
                            fontWeight: 600,
                            fontSize: "11px",
                            height: 22,
                            textTransform: "capitalize",
                            bgcolor:
                              tab === "-"
                                ? "rgba(107, 114, 128, 0.1)"
                                : "rgba(79, 70, 229, 0.1)",
                            color:
                              tab === "-"
                                ? COLORS.textSecondary
                                : COLORS.accent,
                          }}
                        />
                        <Tooltip title={interaction.endpoint} arrow>
                          <Typography
                            sx={{
                              fontSize: "13px",
                              color: COLORS.textPrimary,
                              fontFamily: "monospace",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {interaction.endpoint}
                          </Typography>
                        </Tooltip>
                        <Box sx={{ overflow: "hidden" }}>
                          <Tooltip title={params} arrow>
                            <Typography
                              sx={{
                                fontSize: "12px",
                                color: COLORS.textPrimary,
                                fontFamily: "monospace",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {params}
                            </Typography>
                          </Tooltip>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>

                {/* Pagination Footer */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    px: 3,
                    py: 2,
                    borderTop: `1px solid ${COLORS.border}`,
                    bgcolor: COLORS.bgCard,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Typography
                      sx={{ fontSize: "13px", color: COLORS.textSecondary }}
                    >
                      Rows per page
                    </Typography>
                    <Select
                      value={sessionInteractionPageSize}
                      onChange={(e) =>
                        handleSessionInteractionPageSizeChange(
                          e.target.value as number,
                        )
                      }
                      size="small"
                      sx={{
                        ...selectStyles,
                        minWidth: 70,
                        ".MuiSelect-select": { py: 0.5, px: 1.5 },
                      }}
                      MenuProps={menuProps}
                    >
                      {SESSION_PAGE_SIZE_OPTIONS.map((size) => (
                        <MenuItem key={size} value={size} sx={menuItemStyles}>
                          {size}
                        </MenuItem>
                      ))}
                    </Select>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Typography
                      sx={{ fontSize: "13px", color: COLORS.textSecondary }}
                    >
                      {(sessionInteractionPage - 1) *
                        sessionInteractionPageSize +
                        1}
                      -
                      {Math.min(
                        sessionInteractionPage * sessionInteractionPageSize,
                        totalSessionInteractions,
                      )}{" "}
                      of {totalSessionInteractions}
                    </Typography>
                    {totalSessionInteractionPages > 1 && (
                      <Pagination
                        count={totalSessionInteractionPages}
                        page={sessionInteractionPage}
                        onChange={(_, value) =>
                          setSessionInteractionPage(value)
                        }
                        size="small"
                        sx={{
                          "& .MuiPaginationItem-root": {
                            color: COLORS.textSecondary,
                            borderColor: COLORS.border,
                          },
                          "& .Mui-selected": {
                            bgcolor: `${COLORS.accent} !important`,
                            color: "#fff !important",
                          },
                        }}
                      />
                    )}
                  </Box>
                </Box>
              </>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default UserActivityLog;
