"use client";
import { users } from "@/constants/Grid-Table/ColDefs";
import { useRouter } from "next/navigation";
import useUsersColumn from "@/hooks/Ag-Grid/useUsersColumn";
import {
  Box,
  FormControl,
  TextField,
  Typography,
  CircularProgress,
  InputAdornment,
  Button,
} from "@mui/material";
import React, { useState, useMemo, useEffect } from "react";
import debounce from "lodash.debounce";
import { useGetProfilesQuery } from "@/redux/services/profileApi";
import Loader from "@/components/Common/Loader";
import ResponsiveDashboard from "../ResponsiveDashboard";
import SearchInput from "@/components/Common/CustomSearch/SearchInput";
import CustomSearchField from "@/components/Common/CustomSearch";
import CustomDatePicker from "@/components/Common/DatePicker/DatePicker";
import CustomSelect from "@/components/Common/CustomTabs/CustomSelect";
import { Send } from "@mui/icons-material";
import { getRowStyle } from "@/utils/gridStyles";
import {
  useGetFullNamesQuery,
  useGetPhoneQuery,
} from "@/redux/services/profileApi";
import DropdownSearchInput from "@/components/Common/CustomSearch/DropdownSearchInput";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../../../../redux/store";
import {
  setActiveTab,
  setOrderItemsOpen,
  setTouchupsOpen,
  setTouchupPensOpen,
  resetAllTabs,
  setCustomerSegmentsOpen,
} from "@/redux/slices/tabSlice";
const CustomerProfile = () => {
  const dispatch = useDispatch();

  const { isCustomerSegmentsOpen, activeTabName } = useSelector(
    (state: RootState) => state.tab
  );
  const userCol = useUsersColumn(users);
  const router = useRouter();

  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [highlightedId, setHighlightedId] = useState<string | number | null>(
    null
  );

  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [sourceFilter, setSourceFilter] = useState<string | undefined>(
    undefined
  );
  const [customerIdFilter, setCustomerIdFilter] = useState<string | undefined>(
    undefined
  );
  const [fullNameFilter, setFullNameFilter] = useState<string | undefined>(
    undefined
  );
  const [phoneNumberFilter, setPhoneNumberFilter] = useState<
    string | undefined
  >(undefined);
  const [dateFilter, setDateFilter] = useState<string | undefined>(undefined);
  const [lastDateFilter, setLastDateFilter] = useState<string | undefined>(
    undefined
  );

  const [customerIdInput, setCustomerIdInput] = useState("");
  const [fullNameInput, setFullNameInput] = useState("");
  const [phoneNumberInput, setPhoneNumberInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isCustomerIDTyping, setIsCustomerIDTyping] = useState(false);
  const [isFullNameTyping, setIsFullNameTyping] = useState(false);
  const [isPhoneNumberTyping, setIsPhoneNumberTyping] = useState(false);
  const [dateInput, setDateInput] = useState<any>(null);
  const [lastDateInput, setLastDateInput] = useState<any>(null);

  const { data, isLoading, refetch, isFetching } = useGetProfilesQuery(
    {
      page,
      page_size: pageSize,
      email: searchTerm || undefined,
      source: sourceFilter || undefined,
      customer_id: customerIdFilter || undefined,
      full_name: fullNameFilter || undefined,
      phone: phoneNumberFilter || undefined,
      created_at: dateFilter || undefined,
      last_order_date: lastDateFilter || undefined,
    },
    { skip: false }
  );
  const { data: fullNameSuggestions = [], isFetching: isFullNameLoading } =
    useGetFullNamesQuery(fullNameInput, {
      skip: fullNameInput.trim().length < 1,
    });

  const { data: PhoneSuggestions = [], isFetching: isPhoneLoading } =
    useGetPhoneQuery(phoneNumberInput, {
      skip: phoneNumberInput.trim().length < 1,
    });
  const rowData = useMemo(() => {
    const results = data?.data || [];
    return results.map((item: any) => ({
      email: item.email,
      phone: item.phone || "",
      full_name: item.full_name || "",
      source: item.source || "",
      customer_id: item.customer_id || "",
      join_type: item.join_type || "",
      key: item.key || "",
      created_at: item.created_at ? item.created_at.split("T")[0] : "N/A",
      last_order_date: item.last_order_date
        ? item.last_order_date.split("T")[0]
        : "N/A",
      total_orders: item.total_orders || "",
    }));
  }, [data]);

  const onRowClicked = (params: any) => {
    const event = params?.event;
    if ((event?.target as HTMLElement).closest(".MuiIconButton-root")) return;

    const { customer_id } = params.data;
    setHighlightedId(customer_id);

    if (!isNaN(Number(customer_id))) {
      if (selectedUser?.customer_id === customer_id) {
        setSelectedUser(null);
      } else {
        setSelectedUser(params.data);
      }
    } else {
      setSelectedUser(null);
    }
  };

  // 🔹 Debounce handlers
  const debouncedSearch = useMemo(
    () =>
      debounce((value: string) => {
        setSearchTerm(value);
        setPage(1);
        setIsTyping(false);
      }, 5000),
    []
  );

  const debouncedCustomerId = useMemo(
    () =>
      debounce((value: string) => {
        setCustomerIdFilter(value ? value.toUpperCase() : undefined);
        setPage(1);
        setIsCustomerIDTyping(false);
      }, 5000),
    []
  );

  const debouncedFullName = useMemo(
    () =>
      debounce((value: string) => {
        setFullNameFilter(value || undefined);
        setPage(1);
        setIsFullNameTyping(false);
      }, 5000),
    []
  );

  const debouncedPhoneNumber = useMemo(
    () =>
      debounce((value: string) => {
        setPhoneNumberFilter(value || undefined);
        setPage(1);
        setIsPhoneNumberTyping(false);
      }, 5000),
    []
  );

  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);

    if (value.trim() === "") {
      setSearchTerm("");
      setPage(1);
      debouncedSearch.cancel();
      dispatch(setCustomerSegmentsOpen(false));
    } else {
      debouncedSearch(value);
      setIsTyping(true);
    }
  };

  const sourceOptions = ["Klaviyo", "Shopify", "Wismo", "Zendesk"];
  const toggleSouceoptions = (option: string) => {
    // If same option clicked again → clear selection
    setSourceFilter((prev) => (prev === option ? "" : option));
  };
  // useEffect(() => {
  //   if (isCustomerSegmentsOpen && data?.data?.length > 0) {
  //     setSelectedUser?.(data.data[0]);
  //   }
  // }, [data]);

  // 🔹 Reset selectedUser whenever any filter/search changes
  useEffect(() => {
    setSelectedUser(null);
  }, [
    searchTerm,
    customerIdFilter,
    fullNameFilter,
    phoneNumberFilter,
    dateFilter,
    lastDateFilter,
    sourceFilter,
  ]);

  // 🔹 Auto-select first user when data loads and filters/search are active
  useEffect(() => {
    const hasActiveFilter =
      searchTerm ||
      customerIdFilter ||
      fullNameFilter ||
      phoneNumberFilter ||
      dateFilter ||
      lastDateFilter;
    // sourceFilter;

    if (isCustomerSegmentsOpen && hasActiveFilter && data?.data?.length > 0) {
      setSelectedUser(data.data[0]);
    }
  }, [
    data,
    searchTerm,
    customerIdFilter,
    fullNameFilter,
    phoneNumberFilter,
    dateFilter,
    lastDateFilter,
    // sourceFilter,
    isCustomerSegmentsOpen,
  ]);

  return (
    <Box flex={1}>
      <Box
        display="flex"
        flexDirection="column"
        width="100%"
        pl={8}
        // pr={0}
        mb={2}
      >
        {/* Top row: Search + Page Size */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          flexWrap="wrap"
          mb={2}
        >
          <Box
            display="flex"
            alignItems="center"
            flex={1}
            minWidth={200}
            mb={{ xs: 1, sm: 0 }}
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
                marginLeft: 8,
              }}
            />
          </Box>

          <Box minWidth={120} mt={2}>
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
        <Box display="flex" flexWrap="wrap" gap={2} mb={2}>
          <SearchInput
            label="Customer ID"
            value={customerIdInput}
            setValue={(val) => {
              setCustomerIdInput(val);
              setIsCustomerIDTyping(true);
            }}
            setFilter={setCustomerIdFilter}
            debouncedFunction={debouncedCustomerId}
            loading={isCustomerIDTyping}
          />

          <DropdownSearchInput
            label="Full Name"
            value={fullNameInput}
            setValue={setFullNameInput}
            setFilter={setFullNameFilter}
            debouncedFunction={debouncedFullName}
            loading={isFullNameLoading}
            suggestions={fullNameSuggestions?.results || []}
          />

          <DropdownSearchInput
            label="Phone Number"
            value={phoneNumberInput}
            setValue={setPhoneNumberInput}
            setFilter={setPhoneNumberFilter}
            debouncedFunction={debouncedPhoneNumber}
            loading={isPhoneLoading}
            width={160}
            suggestions={PhoneSuggestions?.results || []}
          />

          <CustomDatePicker
            label="Created At"
            value={dateInput}
            setValue={setDateInput}
            setFilter={setDateFilter}
            setPage={setPage}
          />

          <CustomDatePicker
            label="Last Order Date"
            value={lastDateInput}
            setValue={setLastDateInput}
            setFilter={setLastDateFilter}
            setPage={setPage}
          />
        </Box>

        {/* Source buttons */}
        <Box display="flex" flexWrap="wrap" gap={1}>
          {sourceOptions.map((option) => (
            <Button
              key={option}
              onClick={() => toggleSouceoptions(option)}
              sx={{
                minWidth: 90,
                height: 36,
                fontSize: 13,
                textTransform: "none",
                borderRadius: "8px",
                fontWeight: 800,
                border: "1px solid transparent",
                color: sourceFilter === option ? "#fff" : "#1C1C1E",
                background: sourceFilter === option ? "#0E1B6B" : "#EDEDF0",
                transition: "all 0.25s ease",
                boxShadow:
                  sourceFilter === option
                    ? "0px 4px 10px rgba(0, 79, 167, 0.3)"
                    : "0px 2px 6px rgba(0,0,0,0.05)",
                "&:hover": {
                  color: sourceFilter === option ? "#fff" : "#1C1C1E",
                  background: sourceFilter === option ? "#131C55" : "#E5E7EB",
                },
              }}
            >
              {option}
            </Button>
          ))}
        </Box>
      </Box>

      {/* Table */}
      {isLoading || isFetching ? (
        <Loader />
      ) : (
        <Box ml={5}>
          <ResponsiveDashboard
            rowData={rowData}
            userCol={userCol}
            onRowClicked={onRowClicked}
            height={465}
            getRowStyle={getRowStyle(highlightedId)}
            selectedCustId={selectedUser?.customer_id}
            enablePagination
            currentPage={page}
            totalPages={data?.total_pages || 1}
            onPageChange={(newPage: any) => setPage(newPage)}
            pagination={false}
            currentMenu="profiles"
            paginationPageSize={pageSize}
            filters={{
              searchTerm,
              sourceFilter,
              customerIdFilter,
              fullNameFilter,
              phoneNumberFilter,
              dateFilter,
              lastDateFilter,
            }}
          />
        </Box>
      )}
    </Box>
  );
};

export default CustomerProfile;
