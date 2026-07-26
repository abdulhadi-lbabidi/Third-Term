import type { CloudFile } from '../../types';
import { OfficeViewer } from './OfficeViewer';

export const SpreadsheetViewer = ({ file }: { file: CloudFile }) => {
  return <OfficeViewer file={file} />;
};
