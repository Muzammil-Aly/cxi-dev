import { PaginationParams } from "./common.types";

// Customer Orders Types
export interface CustomerOrderQueryParams extends PaginationParams {
  customer_email?: string;
  source?: string;
  order_id?: string;
  customer_id?: string;
  customer_name?: string;
  customer_reference_no?: string;
  shipping_address?: string;
  tracking?: string;
  order_date?: string;
  profit_name?: string;
  retailer?: string;
  fulfillment_status?: string;
  order_status?: string;
  psi_number?: string;
  customer_no?: string;
}

export interface CustomerOrder {
  order_id: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  order_date: string;
  total_amount: number;
  order_status: string;
  fulfillment_status: string;
  tracking?: string;
  shipping_address?: string;
  profit_name?: string;
  retailer?: string;
}

// Order Items Types
export interface OrderItem {
  item_id: string;
  order_id: string;
  sku: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface OrderItemsQueryParams {
  orderId: string;
}

// Returns Types
export interface OrderReturn {
  return_id: string;
  order_id: string;
  customer_id: string;
  return_date: string;
  status: string;
  items: OrderItem[];
  total_refund_amount: number;
}

export interface ReturnsQueryParams {
  customer_id: string;
}

// Refunds Types
export interface OrderRefund {
  refund_id: string;
  order_id: string;
  customer_id: string;
  refund_date: string;
  refund_amount: number;
  refund_method: string;
  status: string;
}

export interface RefundsQueryParams {
  customer_id: string;
}
