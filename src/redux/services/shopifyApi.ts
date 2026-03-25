// src/services/shopifyApi.ts
import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "../baseQueryWithReauth";

export type ShopifyStore =
  | "store1"
  | "store2"
  | "store3"
  | "store4"
  | "store5"
  | "store6";

export interface ProductVariant {
  id: string; // gid://shopify/ProductVariant/...
  title: string;
  sku: string | null;
  price: string;
  compareAtPrice: string | null;
  inventoryQuantity: number;
  availableForSale: boolean;
}

export interface ShopifyProduct {
  id: string;
  title: string;
  handle: string;
  status: string;
  vendor: string;
  tags: string[];
  variants: { edges: { node: ProductVariant }[] };
  images: { edges: { node: { url: string; altText: string } }[] };
}

export interface ShopifyOrderAddress {
  firstName: string;
  lastName: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  provinceCode: string;
  countryCode: string;
  zip: string;
  phone?: string;
}

export interface ShopifyOrder {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  displayFinancialStatus: string;
  tags: string[];
  shippingAddress: ShopifyOrderAddress | null;
}

export const shopifyApi = createApi({
  reducerPath: "shopifyApi",
  baseQuery: baseQueryWithReauth,
  endpoints: (builder) => ({
    getProducts: builder.query<ShopifyProduct[], ShopifyStore>({
      query: (store = "store1") => ({
        url: `/shopify/products?store=${store}`,
        method: "GET",
      }),
      transformResponse: (response: { data: ShopifyProduct[] }) =>
        response.data,
    }),
    createOrder: builder.mutation<
      any,
      {
        store?: ShopifyStore;
        email: string;
        financialStatus?: string;
        note?: string;
        tags?: string[];
        lineItems: { variantId: string; quantity: number }[];
        shippingAddress: {
          firstName: string;
          lastName: string;
          address1: string;
          address2?: string;
          company?: string;
          city: string;
          provinceCode: string;
          countryCode: string;
          zip: string;
          phone?: string;
        };
        inventoryBehaviour?: "BYPASS" | "DECREMENT" | "RELEASE";
        sendReceipt?: boolean;
        sendFulfillmentReceipt?: boolean;
      }
    >({
      query: ({
        store = "store1",
        email,
        financialStatus,
        note,
        tags = [],
        lineItems,
        shippingAddress,
        inventoryBehaviour = "BYPASS",
        sendReceipt = false,
        sendFulfillmentReceipt = false,
      }) => ({
        url: `/shopify/create-order?store=${store}`,
        method: "POST",
        body: {
          order: {
            email,
            financialStatus,
            note,
            tags,
            lineItems,
            shippingAddress,
          },
          inventoryBehaviour,
          sendReceipt,
          sendFulfillmentReceipt,
        },
      }),
    }),
    createDraftOrder: builder.mutation<
      any,
      {
        store?: ShopifyStore;
        email: string;
        note?: string;
        tags?: string[];
        lineItems: { variantId: string; quantity: number }[];
        shippingAddress: {
          firstName: string;
          lastName: string;
          address1: string;
          address2?: string;
          company?: string;
          city: string;
          provinceCode: string;
          countryCode: string;
          zip: string;
          phone?: string;
        };
      }
    >({
      query: ({
        store = "store1",
        email,
        note,
        tags = [],
        lineItems,
        shippingAddress,
      }) => ({
        url: `/shopify/create-draft-order?store=${store}`,
        method: "POST",
        body: {
          draftOrder: {
            email,
            note,
            tags,
            lineItems,
            shippingAddress,
          },
        },
      }),
    }),

    updateOrder: builder.mutation<
      any,
      {
        orderId: string;
        store?: ShopifyStore;
        email?: string;
        shippingAddress?: Partial<{
          firstName: string;
          lastName: string;
          company: string;
          address1: string;
          address2: string;
          city: string;
          provinceCode: string;
          countryCode: string;
          zip: string;
          phone: string;
        }>;
        customAttributes?: { key: string; value: string }[];
      }
    >({
      query: ({ orderId, store = "store1", email, shippingAddress, customAttributes }) => ({
        url: `/shopify/order/${orderId}?store=${store}`,
        method: "PUT",
        body: { email, shippingAddress, customAttributes },
      }),
    }),

    updateDraftOrder: builder.mutation<
      any,
      {
        draftOrderId: string;
        store?: ShopifyStore;
        email?: string;
        shippingAddress?: Partial<{
          firstName: string;
          lastName: string;
          company: string;
          address1: string;
          address2: string;
          city: string;
          provinceCode: string;
          countryCode: string;
          zip: string;
          phone: string;
        }>;
        customAttributes?: { key: string; value: string }[];
      }
    >({
      query: ({ draftOrderId, store = "store1", email, shippingAddress, customAttributes }) => ({
        url: `/shopify/draft-order/${draftOrderId}?store=${store}`,
        method: "PUT",
        body: { email, shippingAddress, customAttributes },
      }),
    }),

    getOrderLineItems: builder.query<
      { lineItems: Array<{ id: string; title: string; quantity: number; sku: string | null }>; shippingAddress: ShopifyOrderAddress | null },
      { orderId: string; store?: ShopifyStore }
    >({
      query: ({ orderId, store = "store1" }) => ({
        url: `/shopify/order?order_id=${orderId}&store=${store}`,
        method: "GET",
      }),
      transformResponse: (response: { data: any }) => {
        const edges = response?.data?.lineItems?.edges ?? [];
        const lineItems = edges
          .filter(({ node }: any) => (node.currentQuantity ?? node.quantity ?? 0) > 0)
          .map(({ node }: any) => ({
          id: node.id ?? "",
          title: node.title ?? "",
          quantity: node.currentQuantity ?? node.quantity ?? 0,
          sku: node.sku?.sku ?? null,
        }));
        return { lineItems, shippingAddress: response?.data?.shippingAddress ?? null };
      },
    }),

    editOrder: builder.mutation<
      any,
      {
        orderId: string;
        store?: ShopifyStore;
        operations: Array<{
          type: "addVariant" | "setQuantity" | "removeLineItem" | "addDiscount";
          variantId?: string;
          lineItemId?: string;
          quantity?: number;
          allowDuplicates?: boolean;
          restock?: boolean;
          discount?: {
            description?: string;
            fixedValue?: { amount: number; currencyCode: string };
            percentValue?: number;
          };
        }>;
        notifyCustomer?: boolean;
        staffNote?: string;
      }
    >({
      query: ({ orderId, store = "store1", operations, notifyCustomer, staffNote }) => ({
        url: `/shopify/order/${orderId}/edit?store=${store}`,
        method: "POST",
        body: { operations, notifyCustomer, staffNote },
      }),
    }),

    getShopifyOrders: builder.query<
      { data: ShopifyOrder[]; has_next_page: boolean; end_cursor: string | null },
      { store?: ShopifyStore; limit?: number; query?: string }
    >({
      query: ({ store = "store1", limit = 50, query }) => {
        const params = new URLSearchParams({ store, limit: String(limit) });
        if (query) params.append("query", query);
        return { url: `/shopify/orders?${params}`, method: "GET" };
      },
    }),

    getShopifyDraftOrders: builder.query<
      { data: ShopifyOrder[]; has_next_page: boolean; end_cursor: string | null },
      { store?: ShopifyStore; limit?: number; query?: string }
    >({
      query: ({ store = "store1", limit = 50, query }) => {
        const params = new URLSearchParams({ store, limit: String(limit) });
        if (query) params.append("query", query);
        return { url: `/shopify/draft-orders?${params}`, method: "GET" };
      },
    }),
  }),
});

export const {
  useGetProductsQuery,
  useCreateOrderMutation,
  useCreateDraftOrderMutation,
  useUpdateOrderMutation,
  useUpdateDraftOrderMutation,
  useGetOrderLineItemsQuery,
  useEditOrderMutation,
  useGetShopifyOrdersQuery,
  useGetShopifyDraftOrdersQuery,
} = shopifyApi;
