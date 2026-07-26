import { Cloud } from 'lucide-react';
import { CloudStorageExplorer } from './components/explorer/explorer-grid';
import { PageHeader } from '../components/page-header';

export function CloudStoragePage() {
  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <PageHeader
        badge="إدارة الملفات"
        title="التخزين السحابي"
      />

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
