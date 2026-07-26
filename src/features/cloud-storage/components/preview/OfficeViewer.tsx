import type { CloudFile } from '../../types';

export const OfficeViewer = ({ file }: { file: CloudFile }) => {
  if (!file.url) return <div className="p-4 text-center text-slate-500">الملف غير متاح للعرض</div>;

  // Uses Microsoft Office Online Viewer
  const viewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(file.url)}`;

  return (
    <div className="w-full h-full bg-slate-100 flex flex-col">
      <iframe src={viewerUrl} className="w-full flex-1 border-0" title={file.file_name} />
    </div>
  );
};
