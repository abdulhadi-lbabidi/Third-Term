import { Folder, UploadCloud, ChevronLeft, Search } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';

interface ExplorerHeaderProps {
  breadcrumbs: { id: number | null; name: string }[];
  onNavigate: (id: number | null) => void;
  onNewFolder: () => void;
  onUploadFiles: () => void;
  searchQuery: string;
  onSearchChange: (val: string) => void;
}

export function ExplorerHeader({
  breadcrumbs,
  onNavigate,
  onNewFolder,
  onUploadFiles,
  searchQuery,
  onSearchChange,
}: ExplorerHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6">
      <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 hide-scrollbar">
        {breadcrumbs.map((crumb, index) => (
          <div key={crumb.id ?? 'root'} className="flex items-center">
            <button
              onClick={() => onNavigate(crumb.id)}
              className={`text-sm font-medium hover:text-slate-900 transition-colors whitespace-nowrap ${
                index === breadcrumbs.length - 1 ? 'text-slate-900' : 'text-slate-500'
              }`}
            >
              {crumb.name}
            </button>
            {index < breadcrumbs.length - 1 && (
              <ChevronLeft className="size-4 text-slate-400 mx-1 shrink-0" />
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 w-full md:w-auto">
        <div className="relative w-full md:w-64">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="بحث في المجلد..."
            className="pr-9 h-10 bg-slate-50 border-slate-200"
          />
        </div>
        
        <Button variant="outline" onClick={onNewFolder} className="gap-2 rounded-xl text-slate-600 border-slate-200 h-10 shrink-0">
          <Folder className="size-4" />
          مجلد جديد
        </Button>
        <Button onClick={onUploadFiles} className="gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 h-10 shrink-0">
          <UploadCloud className="size-4" />
          رفع ملفات
        </Button>
      </div>
    </div>
  );
}
