import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/components/ui/form';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import { useUpdateDirectory } from '../../hooks/cloud-storage.hooks';
import type { Directory, CloudFile } from '../../types';

const schema = z.object({
  name: z.string().min(1, 'الاسم مطلوب'),
});

interface RenameItemDialogProps {
  item: Directory | CloudFile | null;
  type: 'folder' | 'file';
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RenameItemDialog({ item, type, open, onOpenChange }: RenameItemDialogProps) {
  const { mutate: updateDirectory, isPending: isUpdatingDir } = useUpdateDirectory();
  // Note: Backend doesn't currently define a rename API for file in app.http, we assume a similar approach if needed or disable for files
  
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
    },
  });

  useEffect(() => {
    if (item && open) {
      form.reset({
        name: type === 'folder' ? (item as Directory).dir_name : (item as CloudFile).file_name,
      });
    }
  }, [item, open, type, form]);

  const onSubmit = (data: z.infer<typeof schema>) => {
    if (!item) return;

    if (type === 'folder') {
      updateDirectory(
        {
          id: item.id,
          payload: { dir_name: data.name },
        },
        {
          onSuccess: () => {
            onOpenChange(false);
          },
        }
      );
    } else {
      // File rename logic (if supported by backend)
      console.warn("File rename is not explicitly supported by backend yet.");
      onOpenChange(false);
    }
  };

  const isPending = isUpdatingDir;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>تعديل اسم ال{type === 'folder' ? 'مجلد' : 'ملف'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الاسم الجديد</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
                {isPending ? 'جاري الحفظ...' : 'حفظ التعديلات'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
