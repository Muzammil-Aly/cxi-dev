// Common types used across the application

export interface PaginationParams {
  page?: number;
  page_size?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total_pages: number;
  count: number;
  current_page?: number;
}

export interface ApiResponse<T> {
  status: number;
  system_status: number;
  data: T;
  message: string;
}

export interface ApiError {
  status: number;
  message: string;
  errors?: Record<string, string[]>;
}

export interface Pagination {
  next_cursor: string | null;
  prev_cursor: string | null;
  self: string;
}
