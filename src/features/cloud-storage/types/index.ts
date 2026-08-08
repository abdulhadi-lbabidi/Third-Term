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
  parent?: Directory | null;
  ancestors?: Directory[];
}

export interface CreateDirectoryPayload {
  dir_name: string;
  dir_path: string;
  parent_dir_id: number | null;
  project_id: number | null;
}

export interface UpdateDirectoryPayload {
  dir_name?: string;
  dir_path?: string;
  parent_dir_id?: number | null;
}

export type DirectorySortField = 'id' | 'created_at' | 'dir_name' | 'dir_path';

export interface DirectoryListParams {
  paginate?: 0 | 1 | boolean;
  per_page?: number;
  page?: number;
  'filter[search]'?: string;
  'filter[project_id]'?: number;
  'filter[parent_dir_id]'?: number;
  sort?: DirectorySortField | `-${DirectorySortField}`;
}

export interface UploadFilesPayload {
  files: File[];
}

export interface MoveFilePayload {
  media_id: number;
  target_directory_id: number;
}

export type ExplorerViewMode = 'grid' | 'list';
export type ExplorerSortBy = 'name' | 'size' | 'date' | 'type';
export type ExplorerSortDirection = 'asc' | 'desc';
