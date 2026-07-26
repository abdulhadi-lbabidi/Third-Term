import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { UploadCloud } from 'lucide-react';
import { useDirectories, useDirectory, useMoveItems } from '../../hooks/cloud-storage.hooks';
import type { Directory, CloudFile } from '../../types';
import { ExplorerHeader } from './explorer-header';
import { FolderCard } from './folder.card';
import { FileCard } from './file.card';
import { CreateFolderDialog } from './create-folder.dialog';
import { RenameItemDialog } from './rename-item.dialog';
import { DeleteItemDialog } from './delete-item.dialog';
import { UploadFilesDialog } from './upload-files.dialog';
import { Skeleton } from '@/shared/components/ui/skeleton';

interface CloudStorageExplorerProps {
  projectId?: number | null;
}

export function CloudStorageExplorer({ projectId }: CloudStorageExplorerProps) {
  const [currentDirId, setCurrentDirId] = useState<number | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<{ id: number | null; name: string }[]>([
    { id: null, name: 'الرئيسية' },
  ]);
  const [searchQuery, setSearchQuery] = useState('');

  // Dialogs state
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [actionTargetDirId, setActionTargetDirId] = useState<number | null>(null);

  const [renameItem, setRenameItem] = useState<{ item: Directory | CloudFile; type: 'folder' | 'file' } | null>(null);
  const [deleteItem, setDeleteItem] = useState<{ item: Directory | CloudFile; type: 'folder' | 'file' } | null>(null);

  // Fetch data
  const { data: rootDirectories = [], isLoading: isLoadingRoot } = useDirectories({
    parent_dir_id: null,
    project_id: projectId,
  });

  const { data: currentDirectory, isLoading: isLoadingDir } = useDirectory(currentDirId as number);
  const { mutate: moveItems } = useMoveItems();

  const isLoading = currentDirId ? isLoadingDir : isLoadingRoot;

  const handleDropItem = (targetFolderId: number | null, item: { type: 'file' | 'folder'; id: number; data?: any }) => {
    if (item.type === 'folder' && item.id === targetFolderId) return;
    moveItems({
      targetDirId: targetFolderId,
      itemIds: [item],
    });
  };

  const currentFolders = currentDirId ? (currentDirectory?.children || []) : rootDirectories;
  const currentFiles = currentDirId ? (currentDirectory?.files || []) : [];

  const handleNavigate = (id: number | null) => {
    setCurrentDirId(id);
    const index = breadcrumbs.findIndex((b) => b.id === id);
    if (index !== -1) {
      setBreadcrumbs(breadcrumbs.slice(0, index + 1));
    } else {
      setBreadcrumbs([{ id: null, name: 'الرئيسية' }]);
    }
  };

  const handleFolderClick = (folder: Directory) => {
    setCurrentDirId(folder.id);
    setBreadcrumbs((prev) => [...prev, { id: folder.id, name: folder.dir_name }]);
    setSearchQuery('');
  };

  const handleDownloadFile = (file: CloudFile) => {
    if (file.url) {
      window.open(file.url, '_blank');
    } else {
      console.warn("No download URL provided for file");
    }
  };

  const filteredFolders = useMemo(() => {
    return currentFolders.filter(d => {
      const name = d.dir_name || '';
      return name.toLowerCase().includes(searchQuery.toLowerCase());
    })
    // .filter(a => a.parent_dir_id == null)
  }, [currentFolders, searchQuery]);

  const filteredFiles = useMemo(() => {
    return currentFiles.filter(f => {
      const name = f.file_name || '';
      return name.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [currentFiles, searchQuery]);

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-2 duration-500">
      <ExplorerHeader
        breadcrumbs={breadcrumbs}
        onNavigate={handleNavigate}
        onNewFolder={() => {
          setActionTargetDirId(currentDirId);
          setIsCreateFolderOpen(true);
        }}
        onUploadFiles={() => {
          setActionTargetDirId(currentDirId);
          setIsUploadOpen(true);
        }}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onDropItem={handleDropItem}
      />

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-32 w-full rounded-2xl" />
          ))}
        </div>
      ) : filteredFolders.length === 0 && filteredFiles.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-20 text-center">
          <UploadCloud className="size-12 text-slate-400 mb-4" />
          <h3 className="text-lg font-semibold text-slate-900">المجلد فارغ</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm">لا توجد ملفات أو مجلدات هنا. يمكنك إنشاء مجلد جديد أو رفع ملفات.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredFolders.map((folder) => (
            <FolderCard
              key={`folder-${folder.id}`}
              folder={folder}
              onClick={handleFolderClick}
              onRename={(f) => setRenameItem({ item: f, type: 'folder' })}
              onDelete={(f) => setDeleteItem({ item: f, type: 'folder' })}
              onNewFolder={(f) => {
                setActionTargetDirId(f.id);
                setIsCreateFolderOpen(true);
              }}
              onUploadFiles={(f) => {
                setActionTargetDirId(f.id);
                setIsUploadOpen(true);
              }}
              onDownload={() => {
                toast.info('تحميل المجلد غير متاح حالياً');
              }}
              onDropItem={handleDropItem}
            />
          ))}

          {filteredFiles.map((file) => (
            <FileCard
              key={`file-${file.id}`}
              file={file}
              onRename={(f) => setRenameItem({ item: f, type: 'file' })}
              onDelete={(f) => setDeleteItem({ item: f, type: 'file' })}
              onDownload={handleDownloadFile}
            />
          ))}
        </div>
      )}

      <CreateFolderDialog
        open={isCreateFolderOpen}
        onOpenChange={setIsCreateFolderOpen}
        parentDirId={actionTargetDirId}
        projectId={projectId}
      />

      <RenameItemDialog
        open={!!renameItem}
        onOpenChange={(open) => !open && setRenameItem(null)}
        item={renameItem?.item ?? null}
        type={renameItem?.type ?? 'folder'}
      />

      <DeleteItemDialog
        open={!!deleteItem}
        onOpenChange={(open) => !open && setDeleteItem(null)}
        item={deleteItem?.item ?? null}
        type={deleteItem?.type ?? 'folder'}
        currentDirId={currentDirId}
      />

      <UploadFilesDialog
        open={isUploadOpen}
        onOpenChange={setIsUploadOpen}
        directoryId={actionTargetDirId}
      />
    </div>
  );
}
