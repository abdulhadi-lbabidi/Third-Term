import { FileDown } from 'lucide-react';
import type { CloudFile } from '../../types';

export const OfficeViewer = ({ file: _file }: { file: CloudFile }) => (
  <div className="grid h-full place-items-center p-6 text-center">
    <div className="max-w-sm space-y-3">
      <FileDown className="mx-auto size-12 text-muted-foreground" />
      <h3 className="font-semibold">المعاينة المحلية غير متاحة</h3>
      <p className="text-sm text-muted-foreground">ملفات Word وExcel وPowerPoint متاحة للتنزيل فقط. استخدم زر التنزيل في أعلى النافذة.</p>
    </div>
  </div>
);
