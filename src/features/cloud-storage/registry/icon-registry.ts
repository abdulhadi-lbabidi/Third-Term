import { FileType } from './file-types';
import type { LucideIcon } from 'lucide-react';
import {
  File as FileIcon,
  Image as ImageIcon,
  Video as VideoIcon,
  Music as AudioIcon,
  FileText as PdfIcon,
  FileText,
  FileSpreadsheet as SheetIcon,
  Presentation as PresentationIcon,
  Archive as ArchiveIcon,
} from 'lucide-react';

export interface FileIconConfig {
  icon: LucideIcon;
  color: string;
  bg: string;
}

export const IconRegistry: Record<FileType, FileIconConfig> = {
  [FileType.Image]: { icon: ImageIcon, color: 'text-info', bg: 'bg-info/10' },
  [FileType.Video]: { icon: VideoIcon, color: 'text-primary', bg: 'bg-primary/10' },
  [FileType.Audio]: { icon: AudioIcon, color: 'text-muted-foreground', bg: 'bg-muted' },
  [FileType.Pdf]: { icon: PdfIcon, color: 'text-destructive', bg: 'bg-destructive/10' },
  [FileType.Office]: { icon: FileText, color: 'text-info', bg: 'bg-info/10' },
  [FileType.Spreadsheet]: { icon: SheetIcon, color: 'text-success', bg: 'bg-success/10' },
  [FileType.Presentation]: { icon: PresentationIcon, color: 'text-warning', bg: 'bg-warning/10' },
  [FileType.Text]: { icon: FileText, color: 'text-muted-foreground', bg: 'bg-muted' },
  [FileType.Archive]: { icon: ArchiveIcon, color: 'text-[var(--accent-gold)]', bg: 'bg-[color-mix(in_srgb,var(--accent-gold)_12%,white)]' },
  [FileType.Unknown]: { icon: FileIcon, color: 'text-muted-foreground', bg: 'bg-muted' },
};
