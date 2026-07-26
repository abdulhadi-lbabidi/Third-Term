import type { CloudFile } from '../../types';
import { OfficeViewer } from './OfficeViewer';

export const PresentationViewer = ({ file }: { file: CloudFile }) => {
  return <OfficeViewer file={file} />;
};
