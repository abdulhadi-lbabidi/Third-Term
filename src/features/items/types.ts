export type ItemMaterial = {
  id: number;
  item_id: number;
  name: string;
  unit: string;
  description?: string;
  created_at?: string;
};

export type Item = {
  id: number;
  name: string;
  description: string;
  materials?: ItemMaterial[];
  created_at?: string;
};

export type CreateItemPayload = {
  name: string;
  description: string;
};

export type UpdateItemPayload = {
  name: string;
  description: string;
};
