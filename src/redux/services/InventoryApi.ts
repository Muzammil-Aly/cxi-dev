import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAccessToken } from "@/utils/auth";

export const inventoryApi = createApi({
  reducerPath: "inventoryApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_BASE_URL,
    prepareHeaders: (headers) => {
      // Try to get JWT token first
      const jwtToken = getAccessToken();
      if (jwtToken) {
        headers.set("Authorization", `Bearer ${jwtToken}`);
      } else {
        // Fallback to Databricks PAT for backwards compatibility
        const token = process.env.NEXT_PUBLIC_DATABRICKS_PAT;
        if (token) {
          headers.set("Authorization", `Bearer ${token}`);
        }
      }
      headers.set("Content-Type", "application/json");
      return headers;
    },
  }),
  endpoints: (builder) => ({
    getLocationCodes: builder.query<any, string | void>({
      query: (name = "") => ({
        url: "/inventory/location-codes",
        params: name ? { name } : {},
      }),
    }),

    getSOInventoryTable: builder.query<
      any,
      {
        document_no?: string;
        customer_name?: string;
        qty?: string;
        qty_commited?: string;
        page?: number;
        page_size?: number;
        location_code?: string;
        item_no?: string;
      }
    >({
      query: ({
        page = 1,
        page_size = 10,
        document_no,
        customer_name,
        qty,
        qty_commited,
        location_code,
        item_no,
      }) => {
        const params = new URLSearchParams();
        params.set("page", page.toString());
        params.set("page_size", page_size.toString());
        if (document_no) params.set("document_no", document_no);
        if (qty) params.set("qty", qty);
        if (customer_name) params.set("customer_name", customer_name);
        if (qty_commited) params.set("qty_commited", qty_commited);

        if (location_code) params.set("location_code", location_code);
        if (item_no) params.set("item_no", item_no);
        return {
          url: `/qty_so_pop_up?${params.toString()}`,
        };
      },
    }),
    getPOInventoryTable: builder.query<
      any,
      {
        location_code?: string;
        item_no?: string;
        shipment_status?: string;
        expected_receipt_date?: string;
        page?: number;
        page_size?: number;
      }
    >({
      query: ({
        page = 1,
        page_size = 10,
        location_code,
        item_no,
        shipment_status,
        expected_receipt_date,
      }) => {
        const params = new URLSearchParams();
        params.set("page", page.toString());
        params.set("page_size", page_size.toString());
        if (shipment_status) params.set("shipment_status", shipment_status);
        if (expected_receipt_date)
          params.set("expected_receipt_date", expected_receipt_date);

        if (location_code) params.set("location_code", location_code);
        if (item_no) params.set("item_no", item_no);
        return {
          url: `/qty_po_pop_up?${params.toString()}`,
        };
      },
    }),

    getQTYoneInventoryTable: builder.query<
      any,
      {
        location_code?: string;
        item_no?: string;
        test_quality?: string;
        lot_no?: string;
        blocked?: string;
        page?: number;
        page_size?: number;
      }
    >({
      query: ({
        page = 1,
        page_size = 10,
        location_code,
        item_no,
        test_quality,
        lot_no,
        blocked,
      }) => {
        const params = new URLSearchParams();
        params.set("page", page.toString());
        params.set("page_size", page_size.toString());

        if (item_no) params.set("item_no", item_no);
        if (location_code) params.set("location_code", location_code);
        if (test_quality) params.set("test_quality", test_quality);
        if (lot_no) params.set("lot_no", lot_no);
        if (blocked) params.set("blocked", blocked);

        return {
          url: `/qty_available_pop_up1?${params.toString()}`,
        };
      },
    }),
    getQTYtwoInventoryTable: builder.query<
      any,
      {
        item_no?: string;
        description?: string;
        description_2?: string;
        location_code?: string;
        zone_code?: string;
        lot_no?: string;
        page?: number;
        page_size?: number;
        bin_code?: string;
      }
    >({
      query: ({
        page = 1,
        page_size = 10,
        item_no,
        description,
        description_2,
        location_code,
        zone_code,
        lot_no,
        bin_code,
      }) => {
        const params = new URLSearchParams();
        params.set("page", page.toString());
        params.set("page_size", page_size.toString());

        if (item_no) params.set("item_no", item_no);
        if (description) params.set("description", description);
        if (description_2) params.set("description_2", description_2);
        if (location_code) params.set("location_code", location_code);
        if (zone_code) params.set("zone_code", zone_code);
        if (lot_no) params.set("lot_no", lot_no);
        if (bin_code) params.set("bin_code", bin_code);

        return {
          url: `/qty_available_pop_up2?${params.toString()}`,
        };
      },
    }),

    // Inventory endpoints from profileApi.ts
    getInventory: builder.query<
      any,
      {
        item_no?: string;
        location_code?: any;
        description?: string;
        eta?: string;
        qty?: number;
        qty_available?: number;
        avail_qty_on_hand?: number;
        avail_qty_to_commit?: number;
        qty_on_blocked_lot_bin?: number;
        page?: number;
        page_size?: number;
        life_cycle_status_code?: string;
      }
    >({
      query: ({
        item_no,
        location_code,
        description,
        eta,
        qty,
        qty_available,
        avail_qty_on_hand,
        avail_qty_to_commit,
        qty_on_blocked_lot_bin,
        life_cycle_status_code,
        page = 1,
        page_size = 10,
      }) => {
        const params = new URLSearchParams();
        params.set("page", page.toString());
        params.set("page_size", page_size.toString());

        if (item_no) params.set("item_no", item_no);
        if (Array.isArray(location_code) && location_code.length > 0) {
          params.set("location_code", location_code.join(","));
        } else if (location_code) {
          params.set("location_code", location_code);
        }
        if (description) params.set("description", description);
        if (eta) params.set("eta", eta);
        if (qty !== undefined) params.set("qty", qty.toString());
        if (qty_available !== undefined)
          params.set("qty_available", qty_available.toString());
        if (avail_qty_on_hand !== undefined)
          params.set("avail_qty_on_hand", avail_qty_on_hand.toString());
        if (avail_qty_to_commit !== undefined)
          params.set("avail_qty_to_commit", avail_qty_to_commit.toString());

        if (life_cycle_status_code !== undefined)
          params.set(
            "life_cycle_status_code",
            life_cycle_status_code.toString(),
          );

        if (qty_on_blocked_lot_bin !== undefined)
          params.set(
            "qty_on_blocked_lot_bin",
            qty_on_blocked_lot_bin.toString(),
          );

        return `inventory_Availability?${params.toString()}`;
      },
    }),

    getLocationItemLot: builder.query<
      any,
      { sku: string; page?: number; page_size?: number }
    >({
      query: ({ sku, page = 1, page_size = 10 }) => {
        const params = new URLSearchParams();

        params.set("page", page.toString());
        params.set("page_size", page_size.toString());
        if (sku) params.set("item_no", sku);

        return `/location_item_lot?${params.toString()}`;
      },
    }),

    getNavETA: builder.query<
      any,
      { sku: string; page?: number; page_size?: number }
    >({
      query: ({ sku, page = 1, page_size = 10 }) => {
        const params = new URLSearchParams();
        params.set("page", page.toString());
        params.set("page_size", page_size.toString());
        if (sku) params.set("item_no", sku);

        return `/nav_eta?${params.toString()}`;
      },
    }),

    getItemTrackingComments: builder.query<
      any,
      {
        item_no?: string;
        // serial_lot_no?: string;
        serial_lot_no?: string | null;

        date?: string;
        comment?: string;
        comment_2?: string;
        page?: number;
        page_size?: number;
      }
    >({
      query: ({
        item_no,
        serial_lot_no,
        date,
        comment,
        comment_2,
        page = 1,
        page_size = 10,
      }) => {
        const params = new URLSearchParams();
        params.set("page", page.toString());
        params.set("page_size", page_size.toString());

        if (item_no) params.set("item_no", item_no);
        if (serial_lot_no !== undefined)
          params.set("lot_no", serial_lot_no ?? "null");
        if (date) params.set("date", date);
        if (comment) params.set("comment", comment);
        if (comment_2) params.set("comment_2", comment_2);

        return `/item_tracking_comments?${params.toString()}`;
      },
    }),

    getTouchups: builder.query<
      any,
      {
        page?: number;
        page_size?: number;
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
    >({
      query: ({
        page = 1,
        page_size = 10,
        order_id,
        lot_no,
        sku,
        customer_id,
        parts_item_no,
        parts_item_name,
        parts_item_name_2,
        touchup_pen_item_no,
        touchup_pen_item_name,
        brand,
        color_slug,
        color_name,
        parts_version,
      }) => {
        const params = new URLSearchParams();
        params.set("page", page.toString());
        params.set("page_size", page_size.toString());
        if (order_id) params.set("order_id", order_id);
        // if (lot_no !== undefined) params.set("lot_no", lot_no ?? "");
        if (lot_no) params.set("lot_no", lot_no);
        if (sku) params.set("sku", sku);
        if (customer_id) params.set("customer_id", customer_id);
        if (parts_item_no) params.set("parts_item_no", parts_item_no);
        if (parts_item_name) params.set("parts_item_name", parts_item_name);
        if (parts_item_name_2)
          params.set("parts_item_name_2", parts_item_name_2);
        if (touchup_pen_item_no)
          params.set("touchup_pen_item_no", touchup_pen_item_no);
        if (touchup_pen_item_name)
          params.set("touchup_pen_item_name", touchup_pen_item_name);
        if (brand) params.set("brand", brand);
        if (color_slug) params.set("color_slug", color_slug);
        if (color_name) params.set("color_name", color_name);
        if (parts_version) params.set("parts_version", parts_version);

        return `touchup_part?${params.toString()}`;
      },
    }),

    getTouchupPens: builder.query<
      any,
      {
        page?: number;
        page_size?: number;
        color_slug?: string | null;
        item_num?: string;
        item_name?: string;
        item_name2?: string;
        color_name?: string;
        sku?: string;
        QtyAvailable?: string;
      }
    >({
      query: ({
        page = 1,
        page_size = 10,
        color_slug,
        item_num,
        item_name,
        item_name2,
        color_name,
        sku,
        QtyAvailable,
      }) => {
        const params = new URLSearchParams();
        params.set("page", page.toString());
        params.set("page_size", page_size.toString());

        if (color_slug) params.set("Colorslug", color_slug);
        if (item_num) params.set("item_num", item_num);
        if (item_name) params.set("item_name", item_name);
        if (item_name2) params.set("ItemName2", item_name2);
        if (color_name) params.set("ColorName", color_name);
        if (sku) params.set("sku", sku);
        if (QtyAvailable) params.set("QtyAvailable", QtyAvailable);

        return `touchup_pen?${params.toString()}`;
      },

      transformResponse: (response: any) => {
        const items = response?.data || [];
        return {
          results: Array.isArray(items)
            ? items.map((item: any) => ({
                ItemNum: item.ItemNum,
                ItemName: item.ItemName,
                ItemName2: item.ItemName2,
                Colorslug: item.Colorslug,
                ColorName: item.ColorName,
                QtyAvailable: item.QtyAvailable,
              }))
            : [],
          total_pages: response?.total_pages ?? 1,
          count: response?.count ?? items.length,
        };
      },
    }),

    getLifeCycleStatus: builder.query<any, string | void>({
      query: (name = "") => ({
        url: "/inventory/life_cycle_status",
        params: name ? { name } : {},
      }),
    }),
  }),
});
export const {
  useGetLocationCodesQuery,
  useGetSOInventoryTableQuery,
  useGetPOInventoryTableQuery,
  useGetQTYoneInventoryTableQuery,
  useGetQTYtwoInventoryTableQuery,
  useLazyGetQTYoneInventoryTableQuery, // <-- add this
  useLazyGetQTYtwoInventoryTableQuery, // <-- add this
  useLazyGetSOInventoryTableQuery, // optional, if needed
  useLazyGetPOInventoryTableQuery, // optional, if needed
  // New inventory endpoints
  useGetInventoryQuery,
  useGetLocationItemLotQuery,
  useGetTouchupsQuery,
  useGetTouchupPensQuery,
  useGetLifeCycleStatusQuery,
  useGetNavETAQuery,
  useGetItemTrackingCommentsQuery,
} = inventoryApi;
