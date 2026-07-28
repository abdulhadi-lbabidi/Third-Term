export type Material = {
  id: number;
  item_id?: number;
  name: string;
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
  description: string;
};

export type UpdateMaterialPayload = CreateMaterialPayload;
