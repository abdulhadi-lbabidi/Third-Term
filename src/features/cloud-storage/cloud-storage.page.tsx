import { Cloud } from 'lucide-react';
import { CloudStorageExplorer } from './components/explorer/explorer-grid';
import { PageHeader } from '../components/page-header';

export function CloudStoragePage() {
  return (
    <div className="space-y-5">
      <PageHeader badge="إدارة الملفات" title="التخزين السحابي"  icon={Cloud} />

      <div className="surface-panel p-5">
        <div className="mb-5 flex items-center gap-3 border-b border-border pb-4">
          <div className="flex size-10 items-center justify-center rounded-md border border-border bg-muted text-primary">
            <Cloud className="size-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">التخزين العام للمستندات</p>
            <h3 className="text-base font-semibold text-foreground">الملفات العامة</h3>
          </div>
        </div>

        <CloudStorageExplorer />
      </div>
    </div>
  );
}
