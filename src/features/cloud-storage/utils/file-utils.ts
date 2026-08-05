import type { CloudFile } from '../types';
import { FileType, FileTypeMap } from '../registry/file-types';

export const getFileType = (file: CloudFile | string): FileType => {
  const extension = typeof file === 'string'
    ? file.toLowerCase()
    : (file.extension?.toLowerCase() || '');

  if (!extension) return FileType.Unknown;

  for (const [type, extensions] of Object.entries(FileTypeMap)) {
    if (extensions.includes(extension)) {
      return type as FileType;
    }
  }

  return FileType.Unknown;
};

// Define which file types can be previewed
export const PreviewableTypes = [
  FileType.Image,
  FileType.Video,
  FileType.Audio,
  FileType.Pdf,
  FileType.Text,
  FileType.Office,
  FileType.Spreadsheet,
  FileType.Presentation,
];

export const canPreview = (file: CloudFile): boolean => {
  const type = getFileType(file);
  return PreviewableTypes.includes(type);
};

export const formatSize = (sizeStr: string | number): string => {
  if (typeof sizeStr === 'string' && !/^\d+(\.\d+)?$/.test(sizeStr)) return sizeStr;
  const size = typeof sizeStr === 'string' ? Number(sizeStr) : sizeStr;
  if (!Number.isFinite(size) || size === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(size) / Math.log(k)), sizes.length - 1);
  return parseFloat((size / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export const resolveFileUrl = (url?: string): string | null => {
  if (!url) return null;
  try {
    const source = new URL(url, window.location.origin);
    if (source.origin === window.location.origin) return source.toString();
    return `/file-proxy${source.pathname}${source.search}`;
  } catch {
    return url;
  }
};
