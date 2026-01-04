import { PaginationParams } from "./common.types";

// Inventory Types
export interface InventoryQueryParams extends PaginationParams {
  item_no?: string;
  location_code?: string | string[];
  description?: string;
  eta?: string;
  qty?: number;
  qty_available?: number;
  avail_qty_on_hand?: number;
  avail_qty_to_commit?: number;
  qty_on_blocked_lot_bin?: number;
  life_cycle_status_code?: string;
}

export interface InventoryItem {
  item_no: string;
  location_code: string;
  description: string;
  qty: number;
  qty_available: number;
  avail_qty_on_hand: number;
  avail_qty_to_commit: number;
  qty_on_blocked_lot_bin: number;
  eta?: string;
  life_cycle_status_code?: string;
}

// Location Item Lot Types
export interface LocationItemLot {
  sku: string;
  location_code: string;
  lot_no: string;
  quantity: number;
  bin_code?: string;
  zone_code?: string;
}

export interface LocationItemLotQueryParams extends PaginationParams {
  sku: string;
}

// Touchup Parts Types
export interface TouchupQueryParams extends PaginationParams {
  order_id?: string;
  lot_no?: string | null;
  sku?: string;
  customer_id?: string;
  parts_item_no?: string;
  parts_item_name?: string;
  parts_item_name_2?: string;
  touchup_pen_item_no?: string;
  touchup_pen_item_name?: string;
  brand?: string;
  color_slug?: string;
  color_name?: string;
  parts_version?: string;
}

export interface TouchupPart {
  parts_item_no: string;
  parts_item_name: string;
  parts_item_name_2?: string;
  touchup_pen_item_no?: string;
  touchup_pen_item_name?: string;
  brand?: string;
  color_slug?: string;
  color_name?: string;
  parts_version?: string;
  sku?: string;
  lot_no?: string;
}

// Touchup Pens Types
export interface TouchupPenQueryParams extends PaginationParams {
  color_slug?: string | null;
  item_num?: string;
  item_name?: string;
  item_name2?: string;
  color_name?: string;
  sku?: string;
  QtyAvailable?: string;
}

export interface TouchupPen {
  ItemNum: string;
  ItemName: string;
  ItemName2?: string;
  Colorslug?: string;
  ColorName?: string;
  QtyAvailable: number;
}

export interface TouchupPenResponse {
  results: TouchupPen[];
  total_pages: number;
  count: number;
}

// SO Inventory Types
export interface SOInventoryQueryParams extends PaginationParams {
  document_no?: string;
  customer_name?: string;
  qty?: string;
  qty_commited?: string;
  location_code?: string;
  item_no?: string;
}

// PO Inventory Types
export interface POInventoryQueryParams extends PaginationParams {
  location_code?: string;
  item_no?: string;
  shipment_status?: string;
  expected_receipt_date?: string;
}

// QTY Popup Types
export interface QTYOneInventoryQueryParams extends PaginationParams {
  location_code?: string;
  item_no?: string;
  test_quality?: string;
  lot_no?: string;
  blocked?: string;
}

export interface QTYTwoInventoryQueryParams extends PaginationParams {
  item_no?: string;
  description?: string;
  description_2?: string;
  location_code?: string;
  zone_code?: string;
  lot_no?: string;
  bin_code?: string;
}
