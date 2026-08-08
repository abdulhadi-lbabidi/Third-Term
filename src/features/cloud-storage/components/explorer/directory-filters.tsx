import { useQuery } from '@tanstack/react-query';
import { SlidersHorizontal } from 'lucide-react';
import { projectsApi } from '@/features/projects/projects.api';
import { Button } from '@/shared/components/ui/button';
import { FilterDrawer } from '@/shared/components/ui/filter-drawer';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { SearchableSelect } from '@/shared/components/ui/searchable-select';
import { cn } from '@/shared/lib/utils';

export interface DirectoryFilterValue {
  projectId?: number;
  parentDirectoryId?: number;
}

interface DirectoryFiltersProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: DirectoryFilterValue;
  onChange: (value: DirectoryFilterValue) => void;
  onApply: () => void;
  onReset: () => void;
  projectIdLocked?: boolean;
  activeFilterCount: number;
}

const optionalNumber = (value: string) => {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
};

export function DirectoryFilters({
  open,
  onOpenChange,
  value,
  onChange,
  onApply,
  onReset,
  projectIdLocked = false,
  activeFilterCount,
}: DirectoryFiltersProps) {
  const projectsQuery = useQuery({
    queryKey: ['cloud-storage', 'filter-projects'],
    queryFn: () => projectsApi.getProjects(1, 1000),
    enabled: open,
  });
  const projectOptions = (projectsQuery.data?.data ?? []).map((project) => ({
    value: project.id,
    label: project.name,
  }));

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={cn(activeFilterCount > 0 && 'border-primary text-primary')}
        onClick={() => onOpenChange(true)}
      >
        <SlidersHorizontal className="size-4" />
        فلترة{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
      </Button>

      <FilterDrawer
        open={open}
        onOpenChange={onOpenChange}
        onApply={onApply}
        onReset={onReset}
        title="فلترة المجلدات"
      >
        <div className="space-y-2">
          <Label htmlFor="directory-project-filter">معرّف المشروع</Label>
          <SearchableSelect
            value={value.projectId ?? ''}
            disabled={projectIdLocked}
            loading={projectsQuery.isLoading}
            options={projectOptions}
            placeholder="اختر المشروع"
            searchPlaceholder="ابحث عن مشروع..."
            emptyMessage="لا توجد مشاريع"
            onValueChange={(projectValue) => onChange({
              ...value,
              projectId: projectValue === '' ? undefined : Number(projectValue),
            })}
          />
          {projectIdLocked && (
            <p className="text-xs text-muted-foreground">تم تثبيت المشروع من صفحة تفاصيل المشروع.</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="directory-parent-filter">معرّف المجلد الأب</Label>
          <Input
            id="directory-parent-filter"
            type="number"
            min={1}
            inputMode="numeric"
            value={value.parentDirectoryId ?? ''}
            placeholder="المجلدات الرئيسية"
            onChange={(event) => onChange({ ...value, parentDirectoryId: optionalNumber(event.target.value) })}
          />
        </div>
      </FilterDrawer>
    </>
  );
}
