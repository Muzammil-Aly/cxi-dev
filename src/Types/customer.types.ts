import { PaginationParams, Pagination } from "./common.types";

// Customer Profile Types
export interface CustomerProfileAttributes {
  email: string;
  phone_number: string;
  first_name: string;
  last_name: string;
  organization: string;
  last_event_date: string;
  customer_id?: string;
  full_name?: string;
  source?: string;
  join_type?: string;
  created_at?: string;
  last_order_date?: string;
  predictive_analytics: {
    historic_number_of_orders: number;
  };
  subscriptions: {
    email?: {
      marketing?: {
        consent: string;
      };
    };
  };
}

export interface CustomerProfile {
  id: string;
  type: string;
  attributes: CustomerProfileAttributes;
}

export interface CustomerProfilesResponse {
  status: number;
  system_status: number;
  data: {
    results: CustomerProfile[];
    pagination: Pagination;
  };
  message: string;
}

export interface CustomerProfileQueryParams extends PaginationParams {
  email?: string;
  phone?: string;
  full_name?: string;
  source?: string;
  join_type?: string;
  customer_id?: string;
  key?: string;
  created_at?: string;
  last_order_date?: string;
}

// Customer Segment Types
export interface CustomerSegment {
  segment_id: string;
  segment_name: string;
  customer_count: number;
  created_at: string;
  updated_at: string;
}

export interface SegmentQueryParams extends PaginationParams {}

// Order History Types
export interface OrderHistory {
  order_id: string;
  order_date: string;
  total_amount: number;
  status: string;
  items: number;
}

export interface OrderHistoryQueryParams {
  profileId: string;
}
