import type { CloudFile } from '../../types';

export const TextViewer = ({ file }: { file: CloudFile }) => {
  // In a real implementation, you would fetch the text content and display it here
  return (
    <div className="p-8 w-full h-full bg-white text-slate-800 text-left" dir="ltr">
      <p className="text-sm text-slate-500 mb-4">جاري تحميل المحتوى...</p>
      {/* <pre className="whitespace-pre-wrap font-mono text-sm">{content}</pre> */}
      <a href={file.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
        اضغط هنا لعرض الملف في نافذة جديدة
      </a>
    </div>
  );
};
