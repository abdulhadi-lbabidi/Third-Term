import { Cloud } from 'lucide-react';
import { CloudStorageExplorer } from './components/explorer/explorer-grid';

export function CloudStoragePage() {
  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="rounded-lg border border-slate-200/80 bg-white p-3 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
              إدارة الملفات
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 flex items-center gap-3">
              التخزين السحابي
            </h1>
          </div>
          {/* Action button is omitted here because ExplorerHeader provides New Folder/Upload actions */}
        </div>
      </div>

      <div className="rounded-xl border bg-white p-5 shadow-sm transition-all">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <Cloud className="size-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">التخزين العام للمستندات</p>
            <h3 className="text-xl font-bold tracking-tight text-slate-900">الملفات العامة</h3>
          </div>
        </div>
        
        {/* Render Cloud Storage Explorer for root (no project_id means root/general) */}
        <CloudStorageExplorer />
      </div>
    </div>
  );
}
