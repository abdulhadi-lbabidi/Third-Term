import { useEffect, useState } from 'react';
import { Skeleton } from '@/shared/components/ui/skeleton';
import type { CloudFile } from '../../types';
import { resolveFileUrl } from '../../utils/file-utils';

export const TextViewer = ({ file }: { file: CloudFile }) => {
  const [content, setContent] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const url = resolveFileUrl(file.url);
    setLoading(true);
    setError(false);
    if (!url) {
      setError(true);
      setLoading(false);
      return () => controller.abort();
    }
    fetch(url, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(String(response.status));
        return response.text();
      })
      .then(setContent)
      .catch((requestError: Error) => {
        if (requestError.name !== 'AbortError') setError(true);
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [file.url]);

  if (loading) return <div className="space-y-3 p-6"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-2/3" /></div>;
  if (error) return <div className="grid h-full place-items-center p-6 text-sm text-muted-foreground">تعذر تحميل محتوى الملف.</div>;

  return <pre className="min-h-full whitespace-pre-wrap break-words bg-white p-6 text-left font-mono text-sm leading-6 text-slate-800" dir="ltr">{content}</pre>;
};
