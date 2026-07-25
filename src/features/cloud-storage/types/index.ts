export interface CloudFile {
  id: number;
  directory_id: number;
  name: string;
  original_name?: string;
  path: string;
  size: number;
  mime_type: string;
  created_at: string;
  updated_at: string;
  url?: string; // Optional download/view url
}

export interface Directory {
  id: number;
  dir_name: string;
  dir_path: string;
  parent_dir_id: number | null;
  project_id: number | null;
  created_at: string;
  updated_at: string;
  files?: CloudFile[];
  sub_directories?: Directory[];
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
