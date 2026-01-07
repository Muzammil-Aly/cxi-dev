"use client";
import { useEffect, useMemo, useState } from "react";
import { Box, Typography } from "@mui/material";
import AgGridTable from "@/components/ag-grid";
import { location_item_lot } from "@/constants/Grid-Table/ColDefs";
import useLocationItemLot from "@/hooks/Ag-Grid/useLocationItemLot";
import Loader from "@/components/Common/Loader";
import { useGetLocationItemLotQuery, useGetUserPreferencesQuery } from "@/redux/services/profileApi";
import { getRowStyle } from "@/utils/gridStyles";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../../redux/store";
import { setTouchupsOpen } from "@/redux/slices/tabSlice";

interface Props {
  orderId?: string;
  sku?: string;
  setSelectedOrderItem?: React.Dispatch<React.SetStateAction<any | null>>;
  orderItemSec?: boolean;
  filters?: string;
}

interface ZPartETAItem {
  document_no: string;
  external_document_no: string;
  no: string;
  associated_whole_unit: string;
  description: string;
  alternative_status: string;
  customer_no: string;
  order_date: string;
  sales_order_aging_days: number;
  earliest_eta: string;
  earliest_eta_to_rex: string;
  earliest_eta_to_unga: string;
  earliest_eta_to_unnj: string | null;
  earliest_eta_to_ggtj: string | null;
  "Days to Earliest ETA": number;
  "Days to Rex ETA": number;
  qty: number;
}

const LocationItemLot = ({ sku }: Props) => {
  // Get user ID from localStorage
  const userId = localStorage.getItem("userId") || undefined;

  // Fetch user preferences for column ordering filtered by endpoint
  const { data: userPreferences } = useGetUserPreferencesQuery({
    user_id: userId,
    endpoint: "location_item_lot",
  });

  // Sort columns based on user preferences
  const filteredColumns = useMemo(() => {
    // If no preferences data, return all default columns
    if (!userPreferences || !(userPreferences as any)?.data || (userPreferences as any).data.length === 0) {
      return location_item_lot;
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
    const orderedColumns = location_item_lot
      .filter((col) => preferenceMap.has(col.field))
      .sort((a, b) => {
        const sortA = (preferenceMap.get(a.field) as number) || 999;
        const sortB = (preferenceMap.get(b.field) as number) || 999;
        return sortA - sortB;
      });

    return orderedColumns;
  }, [userPreferences]);

  // Apply column customization
  const orderItemsCol = useLocationItemLot(filteredColumns);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [highlightedId, setHighlightedId] = useState<string | number | null>(
    null
  );
  const [selectedItemDetail, setSelectedItemDetail] =
    useState<ZPartETAItem | null>(null);

  //  Fetch filtered ZPart ETA data (based on SKU)
  const { data, isLoading, isFetching } = useGetLocationItemLotQuery(
    {
      page,
      page_size: pageSize,
      sku: sku || "",
    },
    { skip: !sku } // Only fetch if sku is provided
  );

  //  Map the response data to table format
  const rowData = useMemo(() => {
    const items = data?.data || data || [];
    if (!Array.isArray(items)) return [];

    return items.map((item: any) => ({
      sku: item.sku,
      parts_item_no: item.parts_item_no,
      parts_item_name: item.parts_item_name,
      parts_item_name_2: item.parts_item_name_2,
      potential_qty_available: item.potential_qty_available,
    }));
  }, [data]);

  return (
    <Box
      display="flex"
      flexDirection="column"
      width="100%"
      justifyContent="center"
      alignItems="center"
    >
      {/* Title */}
      <Typography
        className="drag-handle"
        variant="caption"
        sx={{
          fontWeight: 600,
          color: "#fff",
          background: "#1976d2",
          px: 1.5,
          py: 0.5,
          fontSize: "1em",
          borderRadius: "3px 5px 5px 3px",
          position: "relative",
          mb: 2,
          display: "inline-block",
          "::before": {
            content: '""',
            position: "absolute",
            left: -8,
            top: "50%",
            transform: "translateY(-50%)",
            width: 0,
            height: 0,
            borderTop: "8px solid transparent",
            borderBottom: "8px solid transparent",
            borderRight: "8px solid #1976d2",
          },
        }}
      >
        Location Item Lot{sku ? `— ${sku}` : ""}
      </Typography>

      {/* Loader or Table */}
      {isLoading || isFetching ? (
        <Loader />
      ) : rowData.length === 0 ? (
        <Typography color="text.secondary" fontSize={14}>
          {sku
            ? `No  data found for SKU "${sku}"`
            : "Please select an SKU to view  data"}
        </Typography>
      ) : (
        <AgGridTable
          rowData={rowData}
          columnDefs={orderItemsCol}
          height={480}
          enablePagination
          getRowStyle={getRowStyle(highlightedId)}
          currentPage={page}
          totalPages={data?.total_pages || 1}
          onPageChange={(newPage: any) => setPage(newPage)}
          pagination={false}
          currentMenu="support_tickets"
          paginationPageSize={pageSize}
        />
      )}
    </Box>
  );
};

export default LocationItemLot;
