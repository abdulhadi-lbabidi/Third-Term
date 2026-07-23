import { Card, CardContent, CardFooter } from '@/shared/components/ui/card';
import type { CloudFile } from '../types';
import { FileIcon, MoreVertical } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import dayjs from 'dayjs';

interface FileCardProps {
  file: CloudFile;
  onRename?: (file: CloudFile) => void;
}

export function FileCard({ file, onRename }: FileCardProps) {
  return (
    <Card className="hover:bg-accent/50 transition-colors cursor-pointer group">
      <CardContent className="p-4 flex flex-col items-center justify-center gap-4 aspect-square">
        <FileIcon className="size-12 text-primary/50 group-hover:text-primary transition-colors" />
        <div className="text-center w-full">
          <p className="font-medium text-sm truncate" title={file.name}>
            {file.name}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {(file.size / 1024).toFixed(2)} KB
          </p>
        </div>
      </CardContent>
      <CardFooter className="p-2 border-t flex justify-between items-center bg-muted/20">
        <span className="text-[10px] text-muted-foreground pl-2">
          {dayjs(file.createdAt).format('MMM D, YYYY')}
        </span>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon-xs" onClick={(e) => { e.stopPropagation(); onRename?.(file); }}>
            <span className="sr-only">Rename</span>
            <MoreVertical className="size-3" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
