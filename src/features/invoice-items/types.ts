export type InvoiceOption = {
  id: number;
  invoice_number: string;
  date?: string;
  discount?: number;
  final_total?: number;
  is_posted?: boolean;
  is_visible_to_client?: boolean;
  item?: string;
  supplier?: string;
  expense_description?: string;
  created_at?: string;
};

export type InvoiceItemInvoice = {
  id: number;
  invoice_number: string;
  date?: string;
  discount?: number;
  final_total?: number;
  is_posted?: boolean;
  is_visible_to_client?: boolean;
  created_at?: string;
};

export type InvoiceItemMaterial = {
  id: number;
  name: string;
  description?: string;
  created_at?: string;
};

export type InvoiceItem = {
  id: number;
  invoice_id?: number;
  material_id?: number;
  invoice?: InvoiceItemInvoice;
  material?: InvoiceItemMaterial;
  item_description: string;
  unit: string;
  quantity: number;
  unit_price: number;
  total_price?: number;
  created_at?: string;
};

export type CreateInvoiceItemPayload = {
  invoice_id: number;
  material_id: number;
  item_description: string;
  unit: string;
  quantity: number;
  unit_price: number;
};

export type UpdateInvoiceItemPayload = CreateInvoiceItemPayload;
