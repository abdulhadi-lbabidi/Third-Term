import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { ProjectsForm } from './projects.form';
import type { CreateProjectPayload, Project } from '../types';

type ProjectsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: Project | null;
  departments: { id: number; name: string }[];
  onSubmit: (data: CreateProjectPayload) => Promise<void>;
  loading?: boolean;
};

export function ProjectsDialog({ open, onOpenChange, project, departments, onSubmit, loading }: ProjectsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{project ? 'تعديل المشروع' : 'إضافة مشروع جديد'}</DialogTitle>
        </DialogHeader>
        <ProjectsForm defaultValues={project} departments={departments} onSubmit={onSubmit} loading={loading} />
      </DialogContent>
    </Dialog>
  );
}
