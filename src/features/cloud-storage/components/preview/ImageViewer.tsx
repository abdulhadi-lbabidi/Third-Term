import type { CloudFile } from '../../types';

export const ImageViewer = ({ file }: { file: CloudFile }) => {
  if (!file.url) return <div className="p-4 text-center text-slate-500">الصورة غير متاحة للعرض</div>;
  
  return (
    <div className="flex items-center justify-center w-full h-full p-4 bg-slate-50/50">
      <img src={file.url} alt={file.file_name} className="max-w-full max-h-full object-contain rounded-md shadow-sm" />
    </div>
  );
};
