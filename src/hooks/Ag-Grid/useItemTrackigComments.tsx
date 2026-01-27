import { useMemo } from "react";
import { ICellRendererParams } from "ag-grid-community";

export interface Column {
  field: string;
  headerName?: string;
  cellRenderer?: React.ComponentType<ICellRendererParams>;
  width?: number;
  flex?: number;
  sku?: any;
}

const useItemTrackingComments = (columns: Column[]) => {
  return useMemo(() => {
    return columns.map((col: any) => {
      switch (col.field) {
        case "item_no":
          return {
            ...col,
            headerName: "Item No",
            flex: 1,
            minWidth: 140,
          };

        case "lot_no":
          return {
            ...col,
            headerName: "Lot No",
            flex: 1.2,
            minWidth: 160,
          };

        case "parts_version":
          return {
            ...col,
            headerName: "Parts Version",
            flex: 1,
            minWidth: 140,
          };

        case "transaction_specification":
          return {
            ...col,
            headerName: "Transaction Specification",
            flex: 1.2,
            minWidth: 220,
          };

        case "date":
          return {
            ...col,
            headerName: "Date",
            flex: 1,
            minWidth: 140,
          };

        case "comment_2":
          return {
            ...col,
            headerName: "Comment 2",
            flex: 1.5,
            minWidth: 200,
          };

        case "comment":
          return {
            ...col,
            headerName: "Comment",
            flex: 1.5,
            minWidth: 200,
          };

        case "blocked":
          return {
            ...col,
            headerName: "Blocked",
            flex: 0.8,
            minWidth: 100,
          };

        case "test_quality":
          return {
            ...col,
            headerName: "Test Quality",
            flex: 1,
            minWidth: 160,
          };

        case "country_region_of_origin_code":
          return {
            ...col,
            headerName: "Country/Region of Origin",
            flex: 1.2,
            minWidth: 250,
          };

        default:
          return { ...col, flex: 1, minWidth: 120 };
      }
    });
  }, [columns]);
};

export default useItemTrackingComments;
