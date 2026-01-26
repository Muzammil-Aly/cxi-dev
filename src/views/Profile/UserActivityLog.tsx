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
  Tabs,
  Tab,
} from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import LogoutIcon from "@mui/icons-material/Logout";
import ErrorIcon from "@mui/icons-material/Error";
import ComputerIcon from "@mui/icons-material/Computer";
import dayjs, { Dayjs } from "dayjs";
import {
  useGetUserActivityQuery,
  useGetCxiUsersQuery,
  useGetUserInteractionQuery,
} from "@/redux/services/authApi";
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

const getActivityIcon = (type: string) => {
  switch (type) {
    case "LOGIN_SUCCESS":
      return <CheckCircleIcon sx={{ color: "#10b981", fontSize: 20 }} />;
    case "LOGOUT":
      return <LogoutIcon sx={{ color: "#f59e0b", fontSize: 20 }} />;
    case "LOGIN_FAILED":
      return <ErrorIcon sx={{ color: "#ef4444", fontSize: 20 }} />;
    default:
      return <ComputerIcon sx={{ color: "#6366f1", fontSize: 20 }} />;
  }
};

const getActivityColor = (type: string) => {
  switch (type) {
    case "LOGIN_SUCCESS":
      return { bg: "rgba(16, 185, 129, 0.1)", color: "#10b981" };
    case "LOGOUT":
      return { bg: "rgba(245, 158, 11, 0.1)", color: "#f59e0b" };
    case "LOGIN_FAILED":
      return { bg: "rgba(239, 68, 68, 0.1)", color: "#ef4444" };
    default:
      return { bg: "rgba(99, 102, 241, 0.1)", color: "#6366f1" };
  }
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
  if (ua.includes("Chrome")) return "Chrome";
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Safari")) return "Safari";
  if (ua.includes("Edge")) return "Edge";
  if (ua.includes("Postman")) return "Postman";
  return "Unknown Browser";
};

const PAGE_SIZE_OPTIONS = [10, 25, 50];

const UserActivityLog: React.FC<UserActivityLogProps> = ({ open, onClose }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [activityPage, setActivityPage] = useState(1);
  const [interactionPage, setInteractionPage] = useState(1);
  const [activityPageSize, setActivityPageSize] = useState(10);
  const [interactionPageSize, setInteractionPageSize] = useState(10);
  const currentUserId = typeof window !== "undefined" ? localStorage.getItem("userId") || "" : "";
  const [selectedUserId, setSelectedUserId] = useState(currentUserId);

  // Date filters using dayjs (start with no filter)
  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);
  const [dateFilter, setDateFilter] = useState<string | undefined>(undefined);

  // Fetch all users
  const { data: usersData, isLoading: usersLoading } = useGetCxiUsersQuery(undefined, {
    skip: !open,
  });

  // Reset selected user when dialog opens
  useEffect(() => {
    if (open && currentUserId) {
      setSelectedUserId(currentUserId);
      setActivityPage(1);
      setInteractionPage(1);
      setActiveTab(0);
      // Reset date filter to empty
      setStartDate(null);
      setEndDate(null);
      setDateFilter(undefined);
    }
  }, [open, currentUserId]);

  // Parse date filter for API queries
  const parsedDates = dateFilter?.split(",") || [];
  const createdFrom = parsedDates[0] || undefined;
  const createdTo = parsedDates[1] || undefined;

  // Activity query
  const { data: activityData, isLoading: activityLoading, isFetching: activityFetching } = useGetUserActivityQuery(
    {
      user_id: selectedUserId,
      activity_type: "LOGIN_SUCCESS,LOGOUT,LOGIN_FAILED",
      created_from: createdFrom,
      created_to: createdTo,
      page: activityPage,
      page_size: activityPageSize,
    },
    { skip: !open || !selectedUserId || activeTab !== 0 }
  );

  // Interaction query
  const { data: interactionData, isLoading: interactionLoading, isFetching: interactionFetching } = useGetUserInteractionQuery(
    {
      user_id: selectedUserId,
      created_from: createdFrom,
      created_to: createdTo,
      page: interactionPage,
      page_size: interactionPageSize,
    },
    { skip: !open || !selectedUserId || activeTab !== 1 }
  );

  const users = usersData?.data || [];
  const activityRecords = activityData?.data?.records || [];
  const activityPagination = activityData?.data?.pagination;
  const interactionRecords = interactionData?.data?.records || [];
  const interactionPagination = interactionData?.data?.pagination;

  const handleUserChange = (userId: string) => {
    setSelectedUserId(userId);
    setActivityPage(1);
    setInteractionPage(1);
  };

  // Handler for resetting pages when date changes (used by CustomDateRangePicker)
  const handleDatePageReset = (page: number) => {
    setActivityPage(page);
    setInteractionPage(page);
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleActivityPageSizeChange = (size: number) => {
    setActivityPageSize(size);
    setActivityPage(1);
  };

  const handleInteractionPageSizeChange = (size: number) => {
    setInteractionPageSize(size);
    setInteractionPage(1);
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
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
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
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: COLORS.textPrimary }}>
            Activity log
          </Typography>
          {selectedUserId && (
            <Typography sx={{ fontSize: "13px", color: COLORS.textSecondary, mt: 0.5 }}>
              Viewing: {users.find((u) => u.user_id === selectedUserId)?.user_name || selectedUserId}
            </Typography>
          )}
        </Box>
        <IconButton onClick={onClose} sx={{ color: COLORS.textSecondary, "&:hover": { bgcolor: COLORS.bgHover } }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 0, bgcolor: COLORS.bgCard }}>
        {/* Filters Section */}
        <Box sx={{ p: 2.5, borderBottom: `1px solid ${COLORS.border}`, bgcolor: COLORS.bgCard }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <FilterListIcon sx={{ color: COLORS.textSecondary, fontSize: 20 }} />
            <Typography sx={{ fontSize: "14px", fontWeight: 600, color: COLORS.textPrimary }}>
              Filters
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            {/* User Selector */}
            <FormControl size="small" sx={{ minWidth: 200, flex: 1 }}>
              <InputLabel
                id="user-select-label"
                sx={{ color: COLORS.textSecondary, "&.Mui-focused": { color: COLORS.accent } }}
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
                  <MenuItem key={user.user_id} value={user.user_id} sx={menuItemStyles}>
                    <Box>
                      <Typography sx={{ fontSize: "14px", fontWeight: 500, color: COLORS.textPrimary }}>
                        {user.user_name}
                      </Typography>
                      <Typography sx={{ fontSize: "12px", color: COLORS.textSecondary }}>
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

        {/* Tabs */}
        <Box sx={{ borderBottom: `1px solid ${COLORS.border}`, bgcolor: COLORS.bgCard }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            sx={{
              px: 2,
              "& .MuiTab-root": {
                color: COLORS.textSecondary,
                textTransform: "none",
                fontWeight: 500,
                fontSize: "14px",
                minHeight: 48,
                "&.Mui-selected": {
                  color: COLORS.accent,
                  fontWeight: 600,
                },
              },
              "& .MuiTabs-indicator": {
                bgcolor: COLORS.accent,
                height: 2,
              },
            }}
          >
            <Tab label="Login Activity" />
            <Tab label="API Interactions" />
          </Tabs>
        </Box>

        {/* Tab Content */}
        {activeTab === 0 && (
          <>
            {activityLoading || activityFetching ? (
              <Box sx={{ display: "flex", justifyContent: "center", p: 6, bgcolor: COLORS.bgCard }}>
                <CircularProgress sx={{ color: COLORS.accent }} size={32} />
              </Box>
            ) : !selectedUserId ? (
              <Box sx={{ textAlign: "center", p: 6, bgcolor: COLORS.bgCard }}>
                <Typography sx={{ color: COLORS.textSecondary }}>
                  Please select a user to view activity
                </Typography>
              </Box>
            ) : activityRecords.length === 0 ? (
              <Box sx={{ textAlign: "center", p: 6, bgcolor: COLORS.bgCard }}>
                <Typography sx={{ color: COLORS.textSecondary }}>
                  No activity records found for this user
                </Typography>
              </Box>
            ) : (
              <>
                <Box sx={{ p: 2, bgcolor: COLORS.bgCard }}>
                  {/* Table Header */}
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "180px 1fr 150px 100px",
                      gap: 2,
                      px: 2,
                      py: 1.5,
                      borderBottom: `1px solid ${COLORS.border}`,
                      mb: 1,
                    }}
                  >
                    <Typography sx={{ fontSize: "12px", fontWeight: 600, color: COLORS.textSecondary, textTransform: "uppercase" }}>
                      Date and time
                    </Typography>
                    <Typography sx={{ fontSize: "12px", fontWeight: 600, color: COLORS.textSecondary, textTransform: "uppercase" }}>
                      Event
                    </Typography>
                    <Typography sx={{ fontSize: "12px", fontWeight: 600, color: COLORS.textSecondary, textTransform: "uppercase" }}>
                      IP Address
                    </Typography>
                    <Typography sx={{ fontSize: "12px", fontWeight: 600, color: COLORS.textSecondary, textTransform: "uppercase" }}>
                      Browser
                    </Typography>
                  </Box>
                  {activityRecords.map((record) => {
                    const colors = getActivityColor(record.activity_type);
                    return (
                      <Box
                        key={record.id}
                        sx={{
                          display: "grid",
                          gridTemplateColumns: "180px 1fr 150px 100px",
                          gap: 2,
                          px: 2,
                          py: 1.5,
                          alignItems: "center",
                          borderRadius: "8px",
                          "&:hover": {
                            bgcolor: COLORS.bgHover,
                          },
                        }}
                      >
                        <Typography sx={{ fontSize: "13px", color: COLORS.textSecondary }}>
                          {formatDate(record.created_at)}
                        </Typography>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                          <Box
                            sx={{
                              p: 0.75,
                              borderRadius: "6px",
                              bgcolor: colors.bg,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            {getActivityIcon(record.activity_type)}
                          </Box>
                          <Box>
                            <Typography sx={{ fontSize: "14px", fontWeight: 500, color: COLORS.textPrimary }}>
                              {record.activity_type.replace(/_/g, " ")}
                            </Typography>
                            {record.failure_reason && (
                              <Typography sx={{ fontSize: "12px", color: "#ef4444" }}>
                                {record.failure_reason}
                              </Typography>
                            )}
                          </Box>
                          {record.revoked && (
                            <Chip
                              label="UNDO"
                              size="small"
                              sx={{
                                bgcolor: "transparent",
                                color: COLORS.accent,
                                fontSize: "11px",
                                fontWeight: 600,
                                height: 24,
                                cursor: "pointer",
                                "&:hover": { bgcolor: "rgba(79, 70, 229, 0.08)" },
                              }}
                            />
                          )}
                        </Box>
                        <Typography sx={{ fontSize: "13px", color: COLORS.textSecondary }}>
                          {record.ip_address}
                        </Typography>
                        <Typography sx={{ fontSize: "13px", color: COLORS.textSecondary }}>
                          {parseUserAgent(record.user_agent)}
                        </Typography>
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
                    <Typography sx={{ fontSize: "13px", color: COLORS.textSecondary }}>
                      Rows per page
                    </Typography>
                    <Select
                      value={activityPageSize}
                      onChange={(e) => handleActivityPageSizeChange(e.target.value as number)}
                      size="small"
                      sx={{
                        ...selectStyles,
                        minWidth: 70,
                        ".MuiSelect-select": { py: 0.5, px: 1.5 },
                      }}
                      MenuProps={menuProps}
                    >
                      {PAGE_SIZE_OPTIONS.map((size) => (
                        <MenuItem key={size} value={size} sx={menuItemStyles}>
                          {size}
                        </MenuItem>
                      ))}
                    </Select>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    {activityPagination && (
                      <Typography sx={{ fontSize: "13px", color: COLORS.textSecondary }}>
                        {((activityPage - 1) * activityPageSize) + 1}-{Math.min(activityPage * activityPageSize, activityPagination.total_items)} of {activityPagination.total_items}
                      </Typography>
                    )}
                    {activityPagination && activityPagination.total_pages > 1 && (
                      <Pagination
                        count={activityPagination.total_pages}
                        page={activityPage}
                        onChange={(_, value) => setActivityPage(value)}
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

        {activeTab === 1 && (
          <>
            {interactionLoading || interactionFetching ? (
              <Box sx={{ display: "flex", justifyContent: "center", p: 6, bgcolor: COLORS.bgCard }}>
                <CircularProgress sx={{ color: COLORS.accent }} size={32} />
              </Box>
            ) : !selectedUserId ? (
              <Box sx={{ textAlign: "center", p: 6, bgcolor: COLORS.bgCard }}>
                <Typography sx={{ color: COLORS.textSecondary }}>
                  Please select a user to view interactions
                </Typography>
              </Box>
            ) : interactionRecords.length === 0 ? (
              <Box sx={{ textAlign: "center", p: 6, bgcolor: COLORS.bgCard }}>
                <Typography sx={{ color: COLORS.textSecondary }}>
                  No API interaction records found for this user
                </Typography>
              </Box>
            ) : (
              <>
                <Box sx={{ p: 2, bgcolor: COLORS.bgCard }}>
                  {/* Table Header */}
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "180px 80px 1fr 80px 120px",
                      gap: 2,
                      px: 2,
                      py: 1.5,
                      borderBottom: `1px solid ${COLORS.border}`,
                      mb: 1,
                    }}
                  >
                    <Typography sx={{ fontSize: "12px", fontWeight: 600, color: COLORS.textSecondary, textTransform: "uppercase" }}>
                      Date and time
                    </Typography>
                    <Typography sx={{ fontSize: "12px", fontWeight: 600, color: COLORS.textSecondary, textTransform: "uppercase" }}>
                      Method
                    </Typography>
                    <Typography sx={{ fontSize: "12px", fontWeight: 600, color: COLORS.textSecondary, textTransform: "uppercase" }}>
                      Endpoint
                    </Typography>
                    <Typography sx={{ fontSize: "12px", fontWeight: 600, color: COLORS.textSecondary, textTransform: "uppercase" }}>
                      Status
                    </Typography>
                    <Typography sx={{ fontSize: "12px", fontWeight: 600, color: COLORS.textSecondary, textTransform: "uppercase" }}>
                      IP Address
                    </Typography>
                  </Box>
                  {interactionRecords.map((record) => {
                    const methodColors = getMethodColor(record.http_method);
                    return (
                      <Box
                        key={record.id}
                        sx={{
                          display: "grid",
                          gridTemplateColumns: "180px 80px 1fr 80px 120px",
                          gap: 2,
                          px: 2,
                          py: 1.5,
                          alignItems: "center",
                          borderRadius: "8px",
                          "&:hover": {
                            bgcolor: COLORS.bgHover,
                          },
                        }}
                      >
                        <Typography sx={{ fontSize: "13px", color: COLORS.textSecondary }}>
                          {formatDate(record.created_at)}
                        </Typography>
                        <Chip
                          label={record.http_method}
                          size="small"
                          sx={{
                            bgcolor: methodColors.bg,
                            color: methodColors.color,
                            fontWeight: 600,
                            fontSize: "11px",
                            height: 24,
                            width: "fit-content",
                          }}
                        />
                        <Tooltip title={record.endpoint} arrow>
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
                            {record.endpoint}
                          </Typography>
                        </Tooltip>
                        <Chip
                          label={record.response_status}
                          size="small"
                          sx={{
                            bgcolor: "transparent",
                            color: getStatusColor(record.response_status),
                            fontWeight: 600,
                            fontSize: "12px",
                            height: 24,
                            width: "fit-content",
                            border: `1px solid ${getStatusColor(record.response_status)}20`,
                          }}
                        />
                        <Typography sx={{ fontSize: "13px", color: COLORS.textSecondary }}>
                          {record.ip_address}
                        </Typography>
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
                    <Typography sx={{ fontSize: "13px", color: COLORS.textSecondary }}>
                      Rows per page
                    </Typography>
                    <Select
                      value={interactionPageSize}
                      onChange={(e) => handleInteractionPageSizeChange(e.target.value as number)}
                      size="small"
                      sx={{
                        ...selectStyles,
                        minWidth: 70,
                        ".MuiSelect-select": { py: 0.5, px: 1.5 },
                      }}
                      MenuProps={menuProps}
                    >
                      {PAGE_SIZE_OPTIONS.map((size) => (
                        <MenuItem key={size} value={size} sx={menuItemStyles}>
                          {size}
                        </MenuItem>
                      ))}
                    </Select>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    {interactionPagination && (
                      <Typography sx={{ fontSize: "13px", color: COLORS.textSecondary }}>
                        {((interactionPage - 1) * interactionPageSize) + 1}-{Math.min(interactionPage * interactionPageSize, interactionPagination.total_items)} of {interactionPagination.total_items}
                      </Typography>
                    )}
                    {interactionPagination && interactionPagination.total_pages > 1 && (
                      <Pagination
                        count={interactionPagination.total_pages}
                        page={interactionPage}
                        onChange={(_, value) => setInteractionPage(value)}
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
