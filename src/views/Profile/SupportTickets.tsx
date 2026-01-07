"use client";
import { support_tickets } from "@/constants/Grid-Table/ColDefs";
import useSupportTicketColumn from "@/hooks/Ag-Grid/useSupportTickets";

import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
  TextField,
  Autocomplete,
  ListSubheader,
  Button,
  InputAdornment,
  IconButton,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

import React, { useState, useMemo, useEffect } from "react";

import { useGetSupportTicketsQuery } from "@/redux/services/profileApi";
import Loader from "@/components/Common/Loader";
import CustomSearchField from "@/components/Common/CustomSearch";
import debounce from "lodash.debounce";
import { Phone, Send, SpaceBar } from "@mui/icons-material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";

import { exportProfilesToPDF } from "@/utils/exportPDF";
import ResponsiveDashboard from "./TabsContent/ResponsiveDashboard";
import { getRowStyle } from "@/utils/gridStyles";
import SearchInput from "@/components/Common/CustomSearch/SearchInput";
import CustomDatePicker from "@/components/Common/DatePicker/DatePicker";
import CustomSelect from "@/components/Common/CustomTabs/CustomSelect";

import {
  useGetTicketCustomerNamesQuery,
  useGetTicketPhonesQuery,
  useGetTicketTagsQuery,
} from "@/redux/services/supportTicketsApi";
import DropdownSearchInput from "@/components/Common/CustomSearch/DropdownSearchInput";
import { useGetUserPreferencesQuery } from "@/redux/services/profileApi";

interface OrdersProps {
  customerId?: string; // optional prop
}

const SupportTickets = ({ customerId }: { customerId?: string }) => {
  // Get user ID from localStorage
  const userId = localStorage.getItem("userId") || undefined;

  // Fetch user preferences for column ordering filtered by endpoint
  const { data: userPreferences } = useGetUserPreferencesQuery({
    user_id: userId,
    endpoint: "support_tickets",
  });

  // Sort columns based on user preferences
  const filteredColumns = useMemo(() => {
    // If no preferences data, return all default columns
    if (!userPreferences || !(userPreferences as any)?.data || (userPreferences as any).data.length === 0) {
      return support_tickets;
    }

    const prefsData = (userPreferences as any).data;

    // Create a map of preference field to sort order
    const preferenceMap = new Map(
      prefsData.map((pref: any) => [
        pref.preference,
        pref.preference_sort,
      ])
    );

    // Filter columns that exist in preferences and sort by preference_sort
    const orderedColumns = support_tickets
      .filter((col) => preferenceMap.has(col.field))
      .sort((a, b) => {
        const sortA = (preferenceMap.get(a.field) as number) || 999;
        const sortB = (preferenceMap.get(b.field) as number) || 999;
        return sortA - sortB;
      });

    return orderedColumns;
  }, [userPreferences]);

  const ticketColumns = useSupportTicketColumn(filteredColumns);

  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [storeFilter, setStoreFilter] = useState<string | undefined>(undefined);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");

  const [customerIdFilter, setCustomerIdFilter] = useState<string | undefined>(
    undefined
  );
  const [ticketIdFilter, setTicketIdFilter] = useState<string | undefined>(
    undefined
  );
  const [searchInput, setSearchInput] = useState("");

  const [customerNameFilter, setCustomerNameFilter] = useState<
    string | undefined
  >(undefined);
  const [phoneNumberFilter, setPhoneNumberFilter] = useState<
    string | undefined
  >(undefined);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(
    undefined
  );
  const [highlightedId, setHighlightedId] = useState<string | number | null>(
    null
  );
  const [tagsFilter, setTagsFilter] = useState<string | undefined>(undefined);
  const [customerNameInput, setCustomerNameInput] = useState("");
  const [ticketIdInput, setTicketIdInput] = useState("");
  const [phoneNumberInput, setPhoneNumberInput] = useState("");
  const [customerIdInput, setCustomerIdInput] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [dateFilter, setDateFilter] = useState<string | undefined>(undefined);
  const [dateInput, setDateInput] = useState<any>(null);
  const [isCustomerIdTyping, setIsCustomerIdTyping] = useState(false);
  const [isCustomerNameTyping, setIsCustomerNameTyping] = useState(false);
  const [isPhoneNumberTyping, setIsPhoneNumberTyping] = useState(false);
  const [isTicketIdTyping, setIsTicketIdTyping] = useState(false);
  const [isTagsTyping, setIsTagsTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const debouncedCustomerId = useMemo(
    () =>
      debounce((value: string) => {
        setCustomerIdFilter(value ? value.toUpperCase() : undefined);
        setPage(1);
        setIsCustomerIdTyping(false);
      }, 5000),
    []
  );

  const debouncedCustomerName = useMemo(
    () =>
      debounce((value: string) => {
        setCustomerNameFilter(value ? value : undefined);
        setPage(1);
        setIsCustomerNameTyping(false);
      }, 5000),
    []
  );

  const debouncedPhoneNumber = useMemo(
    () =>
      debounce((value: string) => {
        setPhoneNumberFilter(value ? value : undefined);
        setPage(1);
        setIsPhoneNumberTyping(false);
      }, 5000),
    []
  );
  const debouncedTicketId = useMemo(
    () =>
      debounce((value: string) => {
        setTicketIdFilter(value ? value.toUpperCase() : undefined);
        setPage(1);
        setIsTicketIdTyping(false);
      }, 5000),
    []
  );
  const debouncedTags = useMemo(
    () =>
      debounce((value: string) => {
        setTagsFilter(value || undefined);
        setPage(1);
        setIsTagsTyping(false);
      }, 5000),
    []
  );
  const statusOptions = [
    "hold",
    "closed",
    "deleted",
    "pending",
    "open",
    "new",
    "solved",
  ];

  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);

    if (value.trim() === "") {
      setSearchTerm("");
      setPage(1);
      debouncedSearch.cancel(); // cancel pending debounce
    } else {
      debouncedSearch(value);
      setIsTyping(true);
    }
  };

  const debouncedSearch = useMemo(
    () =>
      debounce((value: string) => {
        setSearchTerm(value);
        setPage(1);
        setIsTyping(false);
      }, 5000),
    []
  );

  const { data, isLoading, refetch, isFetching } = useGetSupportTicketsQuery(
    {
      page,
      page_size: pageSize,
      customer_id: customerIdFilter || customerId || undefined,
      ticket_id: ticketIdFilter || undefined,
      customer_name: customerNameFilter || undefined,
      phone_no: phoneNumberFilter || undefined,
      email: searchTerm || undefined,
      // status: statusFilter || undefined,
      status: statusFilter === "All" ? undefined : statusFilter || undefined,

      tags: tagsFilter || undefined,
      created_at: dateFilter || undefined,
    },
    { skip: false }
  );

  const rowData = useMemo(() => {
    const results = data?.data || [];
    // Customer Name, Email, Phone No
    return results.map((item: any) => {
      return {
        ticket_id: item.ticket_id,
        customer_id: item.customer_id || "",
        customer_name: item.customer_name || "",
        email: item.email || "",
        phone_no: item.phone_no || "",
        created_at: item.created_at ? item.created_at.split("T")[0] : "N/A",

        // created_at: item.created_at || "",
        resolved_at: item.resolved_at ? item.resolved_at.split("T")[0] : "N/A",
        status: item.status || "",
        channel: item.channel || "",
        tags: item.tags || "",
        csat_score: item.csat_score ?? null,
        sentiment_score: item.sentiment_score ?? null,
        last_comment_at: item.last_comment_at || null,
        comment_count: item.comment_count ?? null,
      };
    });
  }, [data]);

  const {
    data: customerNameSuggestions = [],
    isFetching: isCustomerNameLoading,
  } = useGetTicketCustomerNamesQuery(customerNameInput, {
    skip: customerNameInput.trim().length < 1,
  });

  const { data: phoneSuggestions = [], isFetching: isPhoneLoading } =
    useGetTicketPhonesQuery(phoneNumberInput, {
      skip: phoneNumberInput.trim().length < 1,
    });

  const { data: ticketTagsSuggestions = [], isFetching: isticketTagsLoading } =
    useGetTicketTagsQuery(tagsInput, {
      skip: tagsInput.trim().length < 1,
    });

  const onRowClicked = (params: any) => {
    const event = params?.event;
    if ((event?.target as HTMLElement).closest(".MuiIconButton-root")) {
      return; // ignore clicks from any MUI icon button
    }
    if (selectedTicket?.ticket_id === params.data.ticket_id) {
      setSelectedTicket(null);
    } else {
      setSelectedTicket(params.data);
    }
  };

  return (
    <Box display="flex">
      <Box flex={1} p={customerId ? 0 : 1}>
        {!customerId && (
          <Box
            display="flex"
            flexDirection="column"
            justifyContent="flex-start"
            alignItems="stretch"
            pl={8}
            gap={2} // uniform spacing between rows
            mb={2}
          >
            {/* Top row: Email search + Status + Page Size */}
            <Box
              display="flex"
              flexWrap="wrap"
              justifyContent="space-between"
              alignItems="center"
              gap={2}
            >
              <Box
                display="flex"
                alignItems="center"
                gap={1}
                flex={1}
                minWidth={200}
              >
                <CustomSearchField
                  value={searchInput}
                  onChange={handleSearchInput}
                  placeholder="Search by Email"
                  fullWidth
                  InputProps={{
                    endAdornment: searchInput.trim() !== "" && isTyping && (
                      <InputAdornment position="end">
                        <CircularProgress size={20} />
                      </InputAdornment>
                    ),
                  }}
                />
                <Send
                  onClick={() => {
                    setSearchTerm(searchInput);
                    setPage(1);
                  }}
                  style={{
                    cursor: "pointer",
                    color: "#004FA7",
                    height: 36,
                    width: 36,
                  }}
                />
              </Box>

              <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
                <FormControl size="small" sx={{ width: 140 }}>
                  <Autocomplete
                    size="small"
                    options={["All", ...statusOptions]}
                    value={statusFilter ?? "All"}
                    onChange={(e, newValue) => {
                      setStatusFilter(
                        !newValue || newValue === "" ? undefined : newValue
                      );
                      setPage(1);
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="Status"
                        size="small"
                        sx={{
                          backgroundColor: "#fff",
                          borderRadius: "8px",
                          fontSize: "14px",
                          "& .MuiOutlinedInput-root": {
                            borderRadius: "8px",
                            height: 36,
                            fontSize: "14px",
                            boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                            "&:hover": {
                              boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
                            },
                            "&.Mui-focused fieldset": {
                              borderColor: "#1976d2",
                              borderWidth: "1.5px",
                            },
                          },
                          "& .MuiInputBase-input": { padding: "6px 10px" },
                        }}
                      />
                    )}
                    slotProps={{
                      paper: {
                        sx: {
                          fontSize: "12px",
                          borderRadius: "8px",
                          padding: "2px 0",
                        },
                      },
                      listbox: {
                        sx: {
                          "& .MuiAutocomplete-option": { padding: "2px 10px" },
                        },
                      },
                    }}
                  />
                </FormControl>

                <CustomSelect
                  label="Page Size"
                  value={pageSize}
                  options={[10, 50, 100]}
                  onChange={(val) => {
                    setPageSize(val);
                    setPage(1);
                  }}
                />
              </Box>
            </Box>

            {/* Filters row */}
            <Box display="flex" flexWrap="wrap" gap={2}>
              <SearchInput
                label="Customer ID"
                value={customerIdInput}
                setValue={(val) => {
                  setCustomerIdInput(val);
                  setIsCustomerIdTyping(true);
                }}
                setFilter={setCustomerIdFilter}
                debouncedFunction={debouncedCustomerId}
                loading={isCustomerIdTyping || (isFetching && !!customerIdFilter)}
                width={150}
              />

              <SearchInput
                label="Ticket ID"
                value={ticketIdInput || ""}
                setValue={(val) => {
                  setTicketIdInput(val);
                  setIsTicketIdTyping(true);
                }}
                setFilter={setTicketIdFilter}
                debouncedFunction={debouncedTicketId}
                loading={isTicketIdTyping || (isFetching && !!ticketIdFilter)}
                width={150}
              />

              <DropdownSearchInput
                label="Tags"
                value={tagsInput}
                setValue={setTagsInput}
                setFilter={setTagsFilter}
                debouncedFunction={debouncedTags}
                loading={isticketTagsLoading || (isFetching && !!tagsFilter)}
                suggestions={ticketTagsSuggestions?.results || []}
                width={150}
              />

              <DropdownSearchInput
                label="Customer Name"
                value={customerNameInput}
                setValue={setCustomerNameInput}
                setFilter={setCustomerNameFilter}
                debouncedFunction={debouncedCustomerName}
                loading={isCustomerNameLoading || (isFetching && !!customerNameFilter)}
                suggestions={customerNameSuggestions?.results || []}
                width={150}
              />

              <DropdownSearchInput
                label="Phone Number"
                value={phoneNumberInput}
                setValue={setPhoneNumberInput}
                setFilter={setPhoneNumberFilter}
                debouncedFunction={debouncedPhoneNumber}
                loading={isPhoneLoading || (isFetching && !!phoneNumberFilter)}
                suggestions={phoneSuggestions?.results || []}
                width={150}
              />

              <CustomDatePicker
                label="Created At"
                value={dateInput}
                setValue={setDateInput}
                setFilter={setDateFilter}
                setPage={setPage}
              />
            </Box>
          </Box>
        )}

        {isLoading || isFetching ? (
          <Loader />
        ) : (
          <Box ml={customerId ? 0 : 5}>
            <ResponsiveDashboard
              rowData={rowData}
              userCol={ticketColumns}
              onRowClicked={onRowClicked}
              // getRowStyle={getRowStyle}
              getRowStyle={getRowStyle(highlightedId)}
              selectedTicket={selectedTicket?.ticket_id}
              enablePagination
              currentPage={page}
              totalPages={data?.total_pages || 1}
              onPageChange={(newPage: any) => setPage(newPage)}
              pagination={false}
              currentMenu="support_tickets"
              paginationPageSize={pageSize}
            />
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default SupportTickets;
