import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { useDeleteDirectory, useDeleteFile } from '../../hooks/cloud-storage.hooks';
import type { Directory, CloudFile } from '../../types';

interface DeleteItemDialogProps {
  item: Directory | CloudFile | null;
  type: 'folder' | 'file';
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteItemDialog({ item, type, open, onOpenChange }: DeleteItemDialogProps) {
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
      deleteFile(
        { directoryId: file.directory_id, fileId: file.id },
        {
          onSuccess: () => onOpenChange(false),
        }
      );
    }
  };

  const itemName = item ? (type === 'folder' ? (item as Directory).dir_name : (item as CloudFile).name) : '';

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>هل أنت متأكد من الحذف؟</AlertDialogTitle>
          <AlertDialogDescription>
            سيتم حذف {type === 'folder' ? 'المجلد' : 'الملف'} "{itemName}" بشكل نهائي. لا يمكن التراجع عن هذا الإجراء.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
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
