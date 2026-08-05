import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/shared/components/ui/alert-dialog';
import { useDeleteDirectory, useDeleteFile } from '../../hooks/cloud-storage.hooks';
import type { Directory, CloudFile } from '../../types';

interface DeleteItemDialogProps {
  item: Directory | CloudFile | null;
  type: 'folder' | 'file';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentDirId?: number | null;
}

export function DeleteItemDialog({ item, type, open, onOpenChange, currentDirId }: DeleteItemDialogProps) {
  const { mutate: deleteDirectory, isPending: isDeletingDir } = useDeleteDirectory();
  const { mutate: deleteFile, isPending: isDeletingFile } = useDeleteFile();

  const isPending = isDeletingDir || isDeletingFile;

  const handleDelete = () => {
    if (!item) return;

    if (type === 'folder') {
      deleteDirectory(item.id, {
        onSuccess: () => onOpenChange(false),
      });
    } else {
      const file = item as CloudFile;
      const dirId = file.directory_id || currentDirId || 0;
      deleteFile(
        { directoryId: dirId, fileId: file.id },
        {
          onSuccess: () => onOpenChange(false),
        }
      );
    }
  };

  const itemName = item ? (type === 'folder' ? (item as Directory).dir_name : (item as CloudFile).file_name) : '';

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent dir="rtl">
        <AlertDialogHeader className="place-items-start text-right sm:place-items-start sm:text-right">
          <AlertDialogTitle>هل أنت متأكد من الحذف؟</AlertDialogTitle>
          <AlertDialogDescription className={"text-start"}>
            سيتم حذف {type === 'folder' ? 'المجلد' : 'الملف'} "{itemName}" بشكل نهائي. لا يمكن التراجع عن هذا الإجراء.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:justify-end">
          <AlertDialogCancel disabled={isPending}>إلغاء</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={isPending}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {isPending ? 'جاري الحذف...' : 'حذف'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
