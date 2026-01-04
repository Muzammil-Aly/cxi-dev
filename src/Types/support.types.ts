import { PaginationParams } from "./common.types";

// Support Ticket Types
export interface SupportTicketQueryParams extends PaginationParams {
  ticket_id?: string;
  customer_id?: string;
  customer_name?: string;
  phone_no?: string;
  email?: string;
  status?: string;
  tags?: string;
  created_at?: string;
}

export interface SupportTicket {
  ticket_id: string;
  customer_id: string;
  customer_name: string;
  email: string;
  phone_no?: string;
  status: string;
  priority?: string;
  subject: string;
  description?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
  assigned_to?: string;
}

// Support Ticket Comments Types
export interface SupportTicketCommentsQueryParams extends PaginationParams {
  customerId?: number;
  ticketId?: number;
}

export interface SupportTicketComment {
  comment_id: string;
  ticket_id: number;
  customer_id: number;
  author: string;
  comment_text: string;
  created_at: string;
  is_public: boolean;
  attachments?: string[];
}

// Zendesk Ticket Types
export interface ZendeskTicketQueryParams {
  email?: string;
}

export interface ZendeskTicket {
  id: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
}
