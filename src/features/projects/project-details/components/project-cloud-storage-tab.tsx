import type { Project } from '@/features/projects/types';
import { CloudStorageExplorer } from '@/features/cloud-storage/components/explorer/explorer-grid';

export function ProjectCloudStorageTab({ project }: { project: Project | null }) {
  if (!project) return null;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-foreground">الملفات والتخزين السحابي</h2>
        <p className="mt-1 text-sm text-muted-foreground">إدارة الملفات والمستندات الخاصة بالمشروع</p>
      </div>

      <CloudStorageExplorer projectId={project.id} />
    </div>
  );
}

