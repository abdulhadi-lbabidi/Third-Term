import { FileType } from './file-types';
import {
  File as FileIcon,
  Image as ImageIcon,
  Video as VideoIcon,
  Music as AudioIcon,
  FileText as PdfIcon,
  FileText,
  FileSpreadsheet as SheetIcon,
  Presentation as PresentationIcon,
  FileCode as CodeIcon,
  Archive as ArchiveIcon,
} from 'lucide-react';

export interface FileIconConfig {
  icon: any;
  color: string;
  bg: string;
}

export const IconRegistry: Record<FileType, FileIconConfig> = {
  [FileType.Image]: { icon: ImageIcon, color: "text-blue-500 group-hover:text-blue-600", bg: "bg-blue-50" },
  [FileType.Video]: { icon: VideoIcon, color: "text-purple-500 group-hover:text-purple-600", bg: "bg-purple-50" },
  [FileType.Audio]: { icon: AudioIcon, color: "text-pink-500 group-hover:text-pink-600", bg: "bg-pink-50" },
  [FileType.Pdf]: { icon: PdfIcon, color: "text-red-500 group-hover:text-red-600", bg: "bg-red-50" },
  [FileType.Office]: { icon: FileText, color: "text-blue-600 group-hover:text-blue-700", bg: "bg-blue-50" },
  [FileType.Spreadsheet]: { icon: SheetIcon, color: "text-emerald-500 group-hover:text-emerald-600", bg: "bg-emerald-50" },
  [FileType.Presentation]: { icon: PresentationIcon, color: "text-orange-500 group-hover:text-orange-600", bg: "bg-orange-50" },
  [FileType.Text]: { icon: FileText, color: "text-slate-600 group-hover:text-slate-700", bg: "bg-slate-100" },
  [FileType.Code]: { icon: CodeIcon, color: "text-amber-600 group-hover:text-amber-700", bg: "bg-amber-50" },
  [FileType.Archive]: { icon: ArchiveIcon, color: "text-amber-700 group-hover:text-amber-800", bg: "bg-amber-100" },
  [FileType.Unknown]: { icon: FileIcon, color: "text-slate-400 group-hover:text-slate-500", bg: "bg-slate-100" },
};
