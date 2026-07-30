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
