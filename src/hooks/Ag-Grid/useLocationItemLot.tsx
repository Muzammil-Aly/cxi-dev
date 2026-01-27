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

const useLocationItemLot = (columns: Column[]) => {
  return useMemo(() => {
    return columns.map((col: any) => {
      switch (col.field) {
        // ✅ Existing fields
        case "sku":
          return {
            ...col,
            headerName: "SKU",
            flex: 1,
            minWidth: 140,
          };

        case "parts_item_no":
          return {
            ...col,
            headerName: "Parts Item No",
            flex: 1.2,
            minWidth: 180,
          };

        case "parts_item_name":
          return {
            ...col,
            headerName: "Parts Item Name",
            flex: 1.5,
            minWidth: 200,
          };

        case "parts_item_name_2":
          return {
            ...col,
            headerName: "Parts Item Name 2",
            flex: 1.2,
            minWidth: 180,
          };

        case "potential_qty_available":
          return {
            ...col,
            headerName: "Potential Qty Available",
            flex: 1,
            minWidth: 180,
            cellStyle: { textAlign: "right", fontWeight: 600 },
          };

        // ✅ New fields from location_item_lot
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
            flex: 1,
            minWidth: 140,
          };

        case "location_code":
          return {
            ...col,
            headerName: "Location Code",
            flex: 1,
            minWidth: 150,
          };

        case "qty":
          return {
            ...col,
            headerName: "Quantity",
            flex: 1,
            minWidth: 120,
            cellStyle: { textAlign: "right", fontWeight: 600 },
          };

        case "lot_test_quality":
          return {
            ...col,
            headerName: "Lot Test Quality",
            flex: 1.2,
            minWidth: 160,
          };

        case "blocked":
          return {
            ...col,
            headerName: "Blocked",
            flex: 1,
            minWidth: 120,
            cellStyle: { textAlign: "center" },
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
            flex: 1.5,
            minWidth: 200,
          };

        // ✅ Fallback for any other columns
        default:
          return { ...col, flex: 1, minWidth: 120 };
      }
    });
  }, [columns]);
};

export default useLocationItemLot;
