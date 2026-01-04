// Central export file for all TypeScript types

// Common types
export type {
  PaginationParams,
  PaginatedResponse,
  ApiResponse,
  ApiError,
  Pagination,
} from "./common.types";

// Customer types
export type {
  CustomerProfileAttributes,
  CustomerProfile,
  CustomerProfilesResponse,
  CustomerProfileQueryParams,
  CustomerSegment,
  SegmentQueryParams,
  OrderHistory,
  OrderHistoryQueryParams,
} from "./customer.types";

// Order types
export type {
  CustomerOrderQueryParams,
  CustomerOrder,
  OrderItem,
  OrderItemsQueryParams,
  OrderReturn,
  ReturnsQueryParams,
  OrderRefund,
  RefundsQueryParams,
} from "./order.types";

// Inventory types
export type {
  InventoryQueryParams,
  InventoryItem,
  LocationItemLot,
  LocationItemLotQueryParams,
  TouchupQueryParams,
  TouchupPart,
  TouchupPenQueryParams,
  TouchupPen,
  TouchupPenResponse,
  SOInventoryQueryParams,
  POInventoryQueryParams,
  QTYOneInventoryQueryParams,
  QTYTwoInventoryQueryParams,
} from "./inventory.types";

// Support types
export type {
  SupportTicketQueryParams,
  SupportTicket,
  SupportTicketCommentsQueryParams,
  SupportTicketComment,
  ZendeskTicketQueryParams,
  ZendeskTicket,
} from "./support.types";

// Events types
export type {
  ProfileEventsQueryParams,
  ProfileEvent,
  ProfileEventsResponse,
  CustomerEventsQueryParams,
  CustomerEvent,
  MarketingEvent,
} from "./events.types";

// Legacy types (from ProfileProps.tsx) - Re-export for backwards compatibility
export type {
  KlaviyoProfileAttributes,
  KlaviyoProfile,
  KlaviyoResponse,
  KlaviyoEventResponse,
  KlaviyoPagination,
} from "./ProfileProps";
