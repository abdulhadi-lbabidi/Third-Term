import type { CloudFile } from '../../types';
import { resolveFileUrl } from '../../utils/file-utils';

export const PdfViewer = ({ file }: { file: CloudFile }) => {
  if (!file.url) return <div className="p-4 text-center text-slate-500">الملف غير متاح للعرض</div>;

  return (
    <div className="w-full h-full bg-slate-100 flex flex-col">
      <iframe src={resolveFileUrl(file.url) ?? undefined} className="w-full flex-1 border-0" title={file.file_name} />
    </div>
  );
};
