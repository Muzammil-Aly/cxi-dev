// src/services/shopifyApi.ts
import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "../baseQueryWithReauth";

export type ShopifyStore = "store1" | "store2" | "store3";

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
  }),
});

export const { useGetProductsQuery, useCreateOrderMutation } = shopifyApi;
