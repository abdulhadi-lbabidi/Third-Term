export type Department = {
  id: number;
  name: string;
  main_manager: string;
  created_at?: string;
  employees?: any[];
  engineers?: any[];
  projects?: any[];
};

export type CreateDepartmentPayload = {
  name: string;
  main_manager: string;
};

export type UpdateDepartmentPayload = {
  name: string;
  main_manager: string;
};
