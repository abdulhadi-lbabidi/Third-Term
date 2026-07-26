import type { CloudFile } from '../types';
import { getFileType } from '../utils/file-utils';
import { PreviewRegistry } from '../registry/preview-registry';

interface PreviewRendererProps {
  file: CloudFile;
}

export const PreviewRenderer = ({ file }: PreviewRendererProps) => {
  const fileType = getFileType(file);
  const Viewer = PreviewRegistry[fileType];

  return <Viewer file={file} />;
};
