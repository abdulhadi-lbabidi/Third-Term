import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { ProjectsForm } from './projects.form';
import type { CreateProjectPayload, Project } from '../types';
import type { ClientRecord } from '@/features/users/types';

type ProjectsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: Project | null;
  clients: ClientRecord[];
  onSubmit: (data: CreateProjectPayload) => Promise<void>;
  loading?: boolean;
};

export function ProjectsDialog({ open, onOpenChange, project, clients, onSubmit, loading }: ProjectsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{project ? 'تعديل المشروع' : 'إضافة مشروع جديد'}</DialogTitle>
        </DialogHeader>
        <ProjectsForm defaultValues={project} clients={clients} onSubmit={onSubmit} loading={loading} />
      </DialogContent>
    </Dialog>
  );
}
