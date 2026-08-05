export type Material = {
  id: number;
  item_id?: number;
  name: string;
  unit?: string;
  description?: string;
  created_at?: string;
  item?: {
    id: number;
    name: string;
  };
};

export type CreateMaterialPayload = {
  item_id: number;
  name: string;
  unit?: string;
  description: string;
};

export type UpdateMaterialPayload = CreateMaterialPayload;

export type PaginationMeta = {
  current_page: number;
  from: number | null;
  last_page: number;
  per_page: number;
  to: number | null;
  total: number;
};

export type MaterialResponse = {
  data: Material[];
  meta?: PaginationMeta;
};
