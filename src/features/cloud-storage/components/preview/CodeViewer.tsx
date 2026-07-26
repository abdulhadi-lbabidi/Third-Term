import type { CloudFile } from '../../types';

export const CodeViewer = ({ file }: { file: CloudFile }) => {
  // Can be implemented using react-syntax-highlighter later
  return (
    <div className="p-8 w-full h-full bg-slate-950 text-slate-300 text-left font-mono" dir="ltr">
      <p className="text-sm text-slate-500 mb-4">جاري تحميل الكود...</p>
      <a href={file.url} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">
        اضغط هنا لعرض الكود المصدري في نافذة جديدة
      </a>
    </div>
  );
};
