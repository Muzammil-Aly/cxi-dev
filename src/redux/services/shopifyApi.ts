// src/services/shopifyApi.ts
import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "../baseQueryWithReauth";

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
    getProducts: builder.query<ShopifyProduct[], void>({
      query: () => ({ url: "/shopify/products", method: "GET" }),
      transformResponse: (response: { data: ShopifyProduct[] }) => response.data,
    }),
    createOrder: builder.mutation<
      any,
      {
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
        // billingAddress: {
        //   firstName: string;
        //   lastName: string;
        //   address1: string;
        //   address2?: string;
        //   company?: string;
        //   city: string;
        //   provinceCode: string;
        //   countryCode: string;
        //   zip: string;
        // };
        inventoryBehaviour?: "BYPASS" | "DECREMENT" | "RELEASE";
        sendReceipt?: boolean;
        sendFulfillmentReceipt?: boolean;
      }
    >({
      query: ({
        email,
        financialStatus,
        note,
        tags = [],
        lineItems,
        shippingAddress,
        // billingAddress,
        inventoryBehaviour = "BYPASS",
        sendReceipt = false,
        sendFulfillmentReceipt = false,
      }) => ({
        url: "/shopify/create-order",
        method: "POST",
        body: {
          order: {
            email,
            financialStatus,
            note,
            tags,
            lineItems,
            shippingAddress,
            // billingAddress,
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
