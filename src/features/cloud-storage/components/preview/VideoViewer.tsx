import type { CloudFile } from '../../types';

export const VideoViewer = ({ file }: { file: CloudFile }) => {
  if (!file.url) return <div className="p-4 text-center text-slate-500">الفيديو غير متاح للعرض</div>;

  return (
    <div className="flex items-center justify-center w-full h-full bg-black">
      <video controls className="max-w-full max-h-full">
        <source src={file.url} />
        متصفحك لا يدعم تشغيل الفيديو.
      </video>
    </div>
  );
};
