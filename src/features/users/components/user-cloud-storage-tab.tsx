import { CloudStorageExplorer } from '@/features/cloud-storage/components/explorer/explorer-grid';

type UserCloudStorageTabProps = {
  userId: number;
};

export function UserCloudStorageTab({ userId }: UserCloudStorageTabProps) {
  return (
    <div className="min-w-0 space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-foreground">الملفات والتخزين السحابي</h2>
        <p className="mt-1 text-sm text-muted-foreground">إدارة الملفات والمستندات الخاصة بالمستخدم</p>
      </div>

      <CloudStorageExplorer userId={userId} />
    </div>
  );
}
