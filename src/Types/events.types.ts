import { PaginationParams } from "./common.types";

// Profile Events Types
export interface ProfileEventsQueryParams extends PaginationParams {
  profileId: string;
}

export interface ProfileEvent {
  event_id: string;
  profile_id: string;
  event_type: string;
  event_name: string;
  timestamp: string;
  properties?: Record<string, any>;
}

export interface ProfileEventsResponse {
  data: {
    results: ProfileEvent[];
  };
}

// Customer Events Types
export interface CustomerEventsQueryParams extends PaginationParams {
  event_type?: string;
  event_id?: string;
  campaign_name?: string;
  customer_id?: string;
  email?: string;
  customer_name?: string;
  event_timestamp?: string;
}

export interface CustomerEvent {
  event_id: string;
  event_type: string;
  campaign_name?: string;
  customer_id: string;
  customer_name: string;
  email: string;
  event_timestamp: string;
  metadata?: Record<string, any>;
}

// Marketing Events (from MarketingEvents API)
export interface MarketingEvent {
  event_id: string;
  event_name: string;
  event_type: string;
  start_date: string;
  end_date?: string;
  status: string;
  participants_count: number;
}
