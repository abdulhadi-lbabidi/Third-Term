import { ArrowRight, ChevronLeft } from 'lucide-react';

type ProjectDetailsHeaderProps = {
  projectName: string;
  onBack: () => void;
};

export function ProjectDetailsHeader({ projectName, onBack }: ProjectDetailsHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
      <div className="flex items-center gap-2 text-xs sm:text-sm text-[#667085] overflow-hidden">
        <button
          type="button"
          onClick={onBack}
          className="hover:text-[#172033] font-medium shrink-0 transition-colors"
        >
          المشاريع
        </button>
        <ChevronLeft className="size-4 shrink-0" />
        <span className="text-[#172033] font-bold truncate">{projectName}</span>
      </div>

      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E7E9EF] rounded-lg text-xs font-bold text-[#667085] hover:bg-slate-50 hover:text-[#172033] shadow-xs transition-all w-fit"
      >
        <ArrowRight className="size-4" />
        العودة للمشاريع
      </button>
    </div>
  );
}
