import { FileType } from './file-types';
import {
  ImageViewer,
  PdfViewer,
  VideoViewer,
  AudioViewer,
  OfficeViewer,
  SpreadsheetViewer,
  PresentationViewer,
  TextViewer,
  ArchiveViewer,
  CodeViewer,
  UnknownViewer
} from '../components/preview';

export const PreviewRegistry: Record<FileType, React.FC<{ file: any }>> = {
  [FileType.Image]: ImageViewer,
  [FileType.Pdf]: PdfViewer,
  [FileType.Video]: VideoViewer,
  [FileType.Audio]: AudioViewer,
  [FileType.Office]: OfficeViewer,
  [FileType.Spreadsheet]: SpreadsheetViewer,
  [FileType.Presentation]: PresentationViewer,
  [FileType.Text]: TextViewer,
  [FileType.Archive]: ArchiveViewer,
  [FileType.Code]: CodeViewer,
  [FileType.Unknown]: UnknownViewer,
};
