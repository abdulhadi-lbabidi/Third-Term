import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { useCreateDirectory } from '../../hooks/cloud-storage.hooks';

const schema = z.object({
  dir_name: z.string().min(1, 'اسم المجلد مطلوب'),
});

interface CreateFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentDirId?: number | null;
  projectId?: number | null;
}

export function CreateFolderDialog({ open, onOpenChange, parentDirId, projectId }: CreateFolderDialogProps) {
  const { mutate: createDirectory, isPending } = useCreateDirectory();
  
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      dir_name: '',
    },
  });

  const onSubmit = (data: z.infer<typeof schema>) => {
    createDirectory(
      {
        dir_name: data.dir_name,
        dir_path: `/projects/${projectId || 'general'}`, // Determine the correct path strategy based on backend logic
        parent_dir_id: parentDirId,
        project_id: projectId,
      },
      {
        onSuccess: () => {
          form.reset();
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>إنشاء مجلد جديد</DialogTitle>
          <DialogDescription>
            أدخل اسم المجلد الجديد الذي ترغب في إنشائه.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="dir_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>اسم المجلد</FormLabel>
                  <FormControl>
                    <Input placeholder="مثال: المستندات القانونية" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
                {isPending ? 'جاري الإنشاء...' : 'إنشاء مجلد'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
