export interface CloudFile {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  createdAt: string;
  folderId?: string;
}

export interface RenameFilePayload {
  name: string;
}
