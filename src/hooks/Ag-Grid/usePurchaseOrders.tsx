import { ICellRendererParams } from "ag-grid-community";
import { useMemo } from "react";

export interface Column {
  field: string;
  headerName?: string;
  cellRenderer?: React.ComponentType<ICellRendererParams>;
  width?: number;
  flex?: number;
  minWidth?: number;
  cellStyle?: any;
  autoHeight?: boolean;
}

const usePurchaseOrders = (columns: Column[]) => {
  return useMemo(() => {
    return columns.map((col: any) => {
      switch (col.field) {
        case "document_no":
          return {
            ...col,
            headerName: "Document No",
            flex: 1,
            minWidth: 160,
          };
        case "customer_name":
          return {
            ...col,
            headerName: "Customer Name",
            flex: 1,
            minWidth: 260,
            autoHeight: true,
          };
        case "qty":
          return {
            ...col,
            headerName: "Quantity",
            flex: 1,
            minWidth: 140,
          };
        case "qty_on_po":
          return {
            ...col,
            headerName: "Quantity on PO",
            flex: 1,
            minWidth: 160,
          };
        case "qty_commited":
          return {
            ...col,
            headerName: "Quantity Committed",
            flex: 1,
            minWidth: 180,
          };
        case "location_code":
          return {
            ...col,
            headerName: "Location Code",
            flex: 1,
            minWidth: 150,
          };
        case "item_no":
          return {
            ...col,
            headerName: "Item No",
            flex: 1,
            minWidth: 160,
          };
        case "shipment_status":
          return {
            ...col,
            headerName: "Shipment Status",
            flex: 1,
            minWidth: 180,
          };
        case "expected_receipt_date":
          return {
            ...col,
            headerName: "Expected Receipt Date",
            flex: 1,
            minWidth: 200,
          };
        case "buy_from_vendor_code":
          return {
            ...col,
            headerName: "Buy From Vendor Code",
            flex: 1,
            minWidth: 200,
          };
        case "document_no":
          return {
            ...col,
            headerName: "Document No",
            flex: 1,
            minWidth: 200,
          };
        default:
          return col;
      }
    });
  }, [columns]);
};

export default usePurchaseOrders;
