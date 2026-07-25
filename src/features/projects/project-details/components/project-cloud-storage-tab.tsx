import type { Project } from '@/features/projects/types';
import { CloudStorageExplorer } from '@/features/cloud-storage/components/explorer/explorer-grid';

export function ProjectCloudStorageTab({ project }: { project: Project | null }) {
  if (!project) return null;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">الملفات والتخزين السحابي</h2>
          <p className="text-sm text-slate-500 mt-1">إدارة الملفات والمستندات الخاصة بالمشروع</p>
        </div>
      </div>

      <CloudStorageExplorer projectId={project.id} />
    </div>
  );
}

