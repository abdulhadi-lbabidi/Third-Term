import type { CloudFile } from '../../types';
import { Music } from 'lucide-react';

export const AudioViewer = ({ file }: { file: CloudFile }) => {
  if (!file.url) return <div className="p-4 text-center text-slate-500">الصوت غير متاح للعرض</div>;

  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-slate-50 p-8 gap-6">
      <div className="size-24 rounded-full bg-pink-100 flex items-center justify-center">
        <Music className="size-10 text-pink-600" />
      </div>
      <audio controls className="w-full max-w-md">
        <source src={file.url} />
        متصفحك لا يدعم تشغيل الصوت.
      </audio>
    </div>
  );
};
