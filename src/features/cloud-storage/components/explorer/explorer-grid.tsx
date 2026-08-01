import { useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';
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
import { FilePreviewDialog } from '../FilePreviewDialog';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { SimplePagination } from '@/components/ui/pagination';

// ── تعريف محلي لـ PaginatedResponse في حال عدم وجوده في types ──
interface PaginatedResponse<T> {
  data: T[];
  links: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
  meta: {
    current_page: number;
    from: number;
    last_page: number;
    links: Array<{ url: string | null; label: string; page: number | null; active: boolean }>;
    path: string;
    per_page: number;
    to: number;
    total: number;
  };
}

// ── Hook debounce ──
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

interface CloudStorageExplorerProps {
  projectId?: number | null;
}

export function CloudStorageExplorer({ projectId }: CloudStorageExplorerProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const dirIdParam = searchParams.get('dirId');
  const currentDirId = dirIdParam ? Number(dirIdParam) : null;

  // ── Pagination state ──
  const [page, setPage] = useState(1);
  const perPage = 50;

  // ── Breadcrumbs ──
  const [breadcrumbs, setBreadcrumbs] = useState<{ id: number | null; name: string }[]>([
    { id: null, name: 'الرئيسية' },
  ]);

  // ── Search ──
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);

  // ── Dialogs state ──
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [actionTargetDirId, setActionTargetDirId] = useState<number | null>(null);

  const [renameItem, setRenameItem] = useState<{ item: Directory | CloudFile; type: 'folder' | 'file' } | null>(null);
  const [deleteItem, setDeleteItem] = useState<{ item: Directory | CloudFile; type: 'folder' | 'file' } | null>(null);
  const [previewFile, setPreviewFile] = useState<CloudFile | null>(null);

  // ── Root level: GET /api/directories?paginate=1&per_page=10&page=1 ──
  const rootParams = {
    ...(projectId ? { 'filter[project_id]': projectId } : {}),
    page,
    per_page: perPage,
  };

  const {
    data: rootData,
    isLoading: isLoadingRoot,
    isError: isRootError,
    error: rootError,
  } = useDirectories(currentDirId ? undefined : rootParams);

  // ── Inside a folder: GET /api/directories/{id} ──
  const {
    data: currentDirectory,
    isLoading: isLoadingDir,
    isError: isDirError,
    error: dirError,
  } = useDirectory(currentDirId);

  const { mutate: moveItems } = useMoveItems();

  const isLoading = currentDirId ? isLoadingDir : isLoadingRoot;

  // ── Error handling ──
  useEffect(() => {
    if (isRootError && rootError) {
      toast.error(`فشل تحميل المجلدات: ${(rootError as Error).message}`);
    }
  }, [isRootError, rootError]);

  useEffect(() => {
    if (isDirError && dirError) {
      toast.error(`فشل تحميل المجلد: ${(dirError as Error).message}`);
    }
  }, [isDirError, dirError]);

  // ── Sync breadcrumbs when current directory changes ──
  useEffect(() => {
    if (currentDirId && currentDirectory) {
      // إذا كانت الـ API تعيد ancestors نستخدمها، وإلا نكتفي بالاسم الحالي
      const ancestors = (currentDirectory as any).ancestors || [];
      const newBreadcrumbs = [
        { id: null, name: 'الرئيسية' },
        ...ancestors.map((a: any) => ({ id: a.id, name: a.dir_name })),
        { id: currentDirId, name: currentDirectory.dir_name },
      ];
      setBreadcrumbs(newBreadcrumbs);
    } else if (!currentDirId) {
      setBreadcrumbs([{ id: null, name: 'الرئيسية' }]);
    }
  }, [currentDirId, currentDirectory]);

  // ── Extract folders and files ──
  const currentFolders: Directory[] = useMemo(() => {
    if (currentDirId) {
      return currentDirectory?.children ?? [];
    }
    if (Array.isArray(rootData)) {
      return rootData;
    }
    if (rootData && typeof rootData === 'object' && 'data' in rootData) {
      return (rootData as PaginatedResponse<Directory>).data;
    }
    return [];
  }, [currentDirId, currentDirectory, rootData]);

  const currentFiles: CloudFile[] = useMemo(() => {
    if (currentDirId) {
      return currentDirectory?.files ?? [];
    }
    return [];
  }, [currentDirId, currentDirectory]);

  const paginationMeta = useMemo(() => {
    if (currentDirId || !rootData || typeof rootData !== 'object' || !('meta' in rootData)) {
      return null;
    }
    return (rootData as PaginatedResponse<Directory>).meta;
  }, [currentDirId, rootData]);

  // ── Handlers ──
  const handleDropItem = useCallback(
    (targetFolderId: number | null, item: { type: 'file' | 'folder'; id: number; data?: any }) => {
      if (item.type === 'folder' && item.id === targetFolderId) return;
      moveItems({ targetDirId: targetFolderId, itemIds: [item] });
    },
    [moveItems]
  );

  const handleNavigate = useCallback(
    (id: number | null) => {
      if (id) {
        searchParams.set('dirId', id.toString());
      } else {
        searchParams.delete('dirId');
        setPage(1);
      }
      setSearchParams(searchParams);

      const index = breadcrumbs.findIndex((b) => b.id === id);
      if (index !== -1) {
        setBreadcrumbs(breadcrumbs.slice(0, index + 1));
      } else if (id !== null) {
        // مؤقتاً نضيف عنصراً باسم "..."
        setBreadcrumbs((prev) => [...prev, { id, name: '...' }]);
      } else {
        setBreadcrumbs([{ id: null, name: 'الرئيسية' }]);
      }
    },
    [searchParams, setSearchParams, breadcrumbs]
  );

  const handleFolderClick = useCallback(
    (folder: Directory) => {
      searchParams.set('dirId', folder.id.toString());
      setSearchParams(searchParams);
      setSearchQuery('');
    },
    [searchParams, setSearchParams]
  );

  const handleDownloadFile = useCallback(async (file: CloudFile) => {
    if (!file.url) {
      toast.error('لا يتوفر رابط لتحميل هذا الملف');
      return;
    }

    const toastId = toast.loading('جاري تجهيز الملف للتحميل...');
    try {
      const response = await axios.get(file.url, { responseType: 'blob' });
      const blob = response.data;
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = file.file_name || 'download';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(blobUrl);
      document.body.removeChild(a);
      toast.success('تم تحميل الملف بنجاح', { id: toastId });
    } catch (error) {
      console.error('Download failed, opening in new tab:', error);
      toast.dismiss(toastId);
      window.open(file.url, '_blank');
    }
  }, []);

  // ── Filtering (debounced) ──
  const filteredFolders = useMemo(
    () =>
      currentFolders.filter((d) =>
        (d.dir_name || '').toLowerCase().includes(debouncedSearch.toLowerCase())
      ),
    [currentFolders, debouncedSearch]
  );

  const filteredFiles = useMemo(
    () =>
      currentFiles.filter((f) =>
        (f.file_name || '').toLowerCase().includes(debouncedSearch.toLowerCase())
      ),
    [currentFiles, debouncedSearch]
  );



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
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-2xl" />
          ))}
        </div>
      ) : filteredFolders.length === 0 && filteredFiles.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-20 text-center">
          <UploadCloud className="size-12 text-slate-400 mb-4" />
          <h3 className="text-lg font-semibold text-slate-900">المجلد فارغ</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm">
            لا توجد ملفات أو مجلدات هنا. يمكنك إنشاء مجلد جديد أو رفع ملفات.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filteredFolders.map((folder) => (
              <FolderCard
                key={`folder-${folder.id}`}
                folder={folder}
                onClick={handleFolderClick}
                onRename={(f: any) => setRenameItem({ item: f, type: 'folder' })}
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
                  toast('تحميل المجلد غير متاح حالياً');
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
                onPreview={setPreviewFile}
              />
            ))}
          </div>

          {!currentDirId && paginationMeta && (
            <SimplePagination
              currentPage={paginationMeta.current_page}
              totalPages={paginationMeta.last_page}
              onPageChange={setPage}
              meta={{
                from: paginationMeta.from,
                to: paginationMeta.to,
                total: paginationMeta.total,
              }}
            />
          )}
        </>
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

      <FilePreviewDialog
        file={previewFile}
        open={!!previewFile}
        onOpenChange={(open) => !open && setPreviewFile(null)}
      />
    </div>
  );
}