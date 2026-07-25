export interface CloudFile {
  id: number;
  directory_id?: number;
  file_name: string;
  original_name?: string;
  path?: string;
  size: string;
  extension: string;
  created_at: string;
  updated_at?: string;
  url?: string;
}

export interface Directory {
  id: number;
  dir_name: string;
  dir_path: string;
  parent_dir_id: number | null;
  project?: null | any;
  created_at: string;
  updated_at?: string;
  files?: CloudFile[];
  children?: Directory[];
}

export interface CreateDirectoryPayload {
  dir_name: string;
  dir_path: string;
  parent_dir_id?: number | null;
  project_id?: number | null;
}

export interface UpdateDirectoryPayload {
  dir_name?: string;
  dir_path?: string;
}

export interface UploadFilesPayload {
  files: File[];
}
