export type AuditLogUser = {
  id: number;
  name: string;
  email: string;
};

export type AuditLog = {
  id: number;
  action_type: string;
  affected_table: string;
  description: string;
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
