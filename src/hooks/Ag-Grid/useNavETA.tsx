import { useMemo } from "react";
import { ICellRendererParams } from "ag-grid-community";

export interface Column {
  field: string;
  headerName?: string;
  cellRenderer?: React.ComponentType<ICellRendererParams>;
  width?: number;
  flex?: number;
  minWidth?: number;
}

const useNavETA = (columns: Column[]) => {
  return useMemo(() => {
    return columns.map((col) => {
      switch (col.field) {
        case "item_no":
          return {
            ...col,
            headerName: "Item No",
            flex: 1,
            minWidth: 140,
          };

        case "description":
          return {
            ...col,
            headerName: "Description",
            flex: 1.5,
            minWidth: 250,
          };

        case "location_code":
          return {
            ...col,
            headerName: "Location Code",
            flex: 1,
            minWidth: 180,
          };

        case "eta":
          return {
            ...col,
            headerName: "ETA",
            flex: 1,
            minWidth: 140,
          };

        case "qty":
          return {
            ...col,
            headerName: "Qty",
            flex: 1,
            minWidth: 120,
            cellStyle: { textAlign: "right", fontWeight: 600 },
          };

        case "qty_available":
          return {
            ...col,
            headerName: "Qty Available",
            flex: 1,
            minWidth: 140,
            cellStyle: { textAlign: "right", fontWeight: 600 },
          };

        case "avail_qty_to_commit":
          return {
            ...col,
            headerName: "Available Qty to Commit",
            flex: 1,
            minWidth: 220,
            cellStyle: { textAlign: "right", fontWeight: 600 },
          };

        case "qty_on_blocked_lot_bin":
          return {
            ...col,
            headerName: "Qty on Blocked Lot Bin",
            flex: 1,
            minWidth: 200,
            cellStyle: { textAlign: "right", fontWeight: 600 },
          };

        case "expected_receipt_qty":
          return {
            ...col,
            headerName: "Expected Receipt Qty",
            flex: 1,
            minWidth: 220,
            cellStyle: { textAlign: "right", fontWeight: 600 },
          };

        case "last_inventory_sync_date":
          return {
            ...col,
            headerName: "Last Inventory Sync Date",
            flex: 1.2,
            minWidth: 220,
          };

        case "last_inventory_sync_time":
          return {
            ...col,
            headerName: "Last Inventory Sync Time",
            flex: 1.2,
            minWidth: 220,
          };

        default:
          return { ...col, flex: 1, minWidth: 120 };
      }
    });
  }, [columns]);
};

export default useNavETA;
