import { ChevronLeft } from 'lucide-react';

type ProjectDetailsHeaderProps = {
  projectName: string;
  onBack: () => void;
};

export function ProjectDetailsHeader({ projectName, onBack }: ProjectDetailsHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground overflow-hidden">
        <button
          type="button"
          onClick={onBack}
          className="hover:text-foreground font-semibold shrink-0 transition-colors"
        >
          المشاريع
        </button>
        <ChevronLeft className="size-4 shrink-0" />
        <span className="text-foreground font-bold truncate">{projectName}</span>
      </div>
    </div>
  );
}
