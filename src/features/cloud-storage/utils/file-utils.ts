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
];

export const canPreview = (file: CloudFile): boolean => {
  const type = getFileType(file);
  return PreviewableTypes.includes(type);
};

export const formatSize = (sizeStr: string | number): string => {
  if (typeof sizeStr === 'string') return sizeStr;
  if (sizeStr === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(sizeStr) / Math.log(k));
  return parseFloat((sizeStr / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};
