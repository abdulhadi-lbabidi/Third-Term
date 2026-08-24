export type AuditLogUser = {
  id: number;
  name: string;
  email: string;
};

export type AuditLogProperties = {
  attributes?: Record<string, any> | null;
  old?: Record<string, any> | null;
};

export type AuditLog = {
  id: number;
  log_name?: string;
  affected_table?: string;
  event?: string;
  action_type?: string;
  description: string;
  properties?: AuditLogProperties | null;
  user?: AuditLogUser | null;
  created_at: string;
};

export type PaginationMetaLink = {
  url: string | null;
  label: string;
  page: number | null;
  active: boolean;
};

export type PaginationMeta = {
  current_page: number;
  from: number | null;
  last_page: number;
  links: PaginationMetaLink[];
  path: string;
  per_page: number;
  to: number | null;
  total: number;
};

export type AuditLogResponse = {
  data: AuditLog[];
  meta?: PaginationMeta;
};
