import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import type { Item } from '../types';
import dayjs from 'dayjs';

type MaterialsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: Item | null;
};

export function MaterialsDialog({ open, onOpenChange, item }: MaterialsDialogProps) {
  const materials = item?.materials ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90dvh] w-[calc(100vw-1rem)] max-w-none flex-col p-4 sm:max-w-[700px] sm:p-6">
        <DialogHeader className="flex-none">
          <DialogTitle className="pe-7 text-lg leading-7">المواد التابعة: {item?.name}</DialogTitle>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto py-4">
          {materials.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد مواد تابعة لهذا البند
            </div>
          ) : (
            <div className="overflow-x-auto overflow-y-auto rounded-lg border border-slate-200/80 max-h-[268px]">
              <table className="min-w-[620px] w-full border-collapse text-right">
                <thead>
                  <tr className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="sticky top-0 bg-slate-50 z-10 px-4 py-3 border-b border-slate-200/80">اسم المادة</th>
                    <th className="sticky top-0 bg-slate-50 z-10 px-4 py-3 border-b border-slate-200/80">البيان</th>
                    <th className="sticky top-0 bg-slate-50 z-10 px-4 py-3 border-b border-slate-200/80">تاريخ الإنشاء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {materials.map((material) => (
                    <tr key={material.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-900">{material.name}</td>
                      <td className="px-4 py-3 text-slate-500 max-w-[250px] truncate" title={material.description}>
                        {material.description || '-'}
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        {material.created_at ? dayjs(material.created_at).format('YYYY-MM-DD') : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </DialogContent>
    </Dialog>
  );
}
