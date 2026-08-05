import { useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Trash2, UploadCloud, X } from 'lucide-react';
import { useDirectories, useDirectory, useMoveItems, useDeleteDirectory, useDeleteFile } from '../../hooks/cloud-storage.hooks';
import type { Directory, CloudFile, ExplorerSortBy, ExplorerSortDirection, ExplorerViewMode } from '../../types';
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
import { Button } from '@/shared/components/ui/button';
import { ExplorerList } from './explorer-list';
import { getFileType, resolveFileUrl } from '../../utils/file-utils';

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
  rootDirectoryId?: number | null;
}

export function CloudStorageExplorer({ projectId, rootDirectoryId = null }: CloudStorageExplorerProps) {
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
  const [viewMode, setViewMode] = useState<ExplorerViewMode>(() => (localStorage.getItem('cloud-explorer-view') as ExplorerViewMode) || 'grid');
  const [sortBy, setSortBy] = useState<ExplorerSortBy>('name');
  const [sortDirection, setSortDirection] = useState<ExplorerSortDirection>('asc');
  const [selected, setSelected] = useState<Set<string>>(() => new Set());

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
  const { mutateAsync: deleteDirectory } = useDeleteDirectory();
  const { mutateAsync: deleteFile } = useDeleteFile();

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
      const resolvedTargetFolderId = targetFolderId ?? rootDirectoryId;

      if (item.type === 'folder' && item.id === resolvedTargetFolderId) return;
      moveItems({ targetDirId: resolvedTargetFolderId, itemIds: [item] });
    },
    [moveItems, rootDirectoryId]
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
      setSelected(new Set());

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
      setSelected(new Set());
    },
    [searchParams, setSearchParams]
  );

  const handleDownloadFile = useCallback(async (file: CloudFile) => {
    if (!file.url) {
      toast.error('لا يتوفر رابط لهذا الملف');
      return;
    }

    const toastId = toast.loading('جاري تنزيل الملف...');
    try {
      const proxyUrl = resolveFileUrl(file.url);
      if (!proxyUrl) throw new Error('Missing file URL');
      const response = await fetch(proxyUrl);
      if (!response.ok) throw new Error(`Download failed with status ${response.status}`);

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = file.file_name || 'download';
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      window.setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
        link.remove();
      }, 1000);
      toast.success('تم تنزيل الملف بنجاح', { id: toastId });
    } catch (error) {
      console.error('File download failed:', error);
      toast.error('تعذر تنزيل الملف', { id: toastId });
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

  const sortFactor = sortDirection === 'asc' ? 1 : -1;
  const sortedFolders = useMemo(() => [...filteredFolders].sort((a, b) => {
    const av = sortBy === 'date' ? new Date(a.created_at).getTime() : (a.dir_name || '').toLowerCase();
    const bv = sortBy === 'date' ? new Date(b.created_at).getTime() : (b.dir_name || '').toLowerCase();
    return String(av).localeCompare(String(bv), 'ar', { numeric: true }) * sortFactor;
  }), [filteredFolders, sortBy, sortFactor]);
  const sortedFiles = useMemo(() => [...filteredFiles].sort((a, b) => {
    const value = (file: CloudFile): string | number => {
      if (sortBy === 'size') return Number.parseFloat(file.size) || 0;
      if (sortBy === 'date') return new Date(file.created_at).getTime();
      if (sortBy === 'type') return getFileType(file);
      return file.file_name.toLowerCase();
    };
    return String(value(a)).localeCompare(String(value(b)), 'ar', { numeric: true }) * sortFactor;
  }), [filteredFiles, sortBy, sortFactor]);

  const changeView = (mode: ExplorerViewMode) => { setViewMode(mode); localStorage.setItem('cloud-explorer-view', mode); };
  const selectItem = (key: string, checked: boolean) => setSelected((current) => {
    const next = new Set(current);
    if (checked) next.add(key);
    else next.delete(key);
    return next;
  });
  const handleBulkDelete = async () => {
    if (!selected.size || !window.confirm(`حذف ${selected.size} عنصر محدد؟`)) return;
    const toastId = toast.loading('جاري حذف العناصر...');
    try {
      await Promise.all([...selected].map((key) => { const [type, id] = key.split(':'); return type === 'folder' ? deleteDirectory(Number(id)) : deleteFile({ directoryId: currentDirId!, fileId: Number(id) }); }));
      setSelected(new Set()); toast.success('تم حذف العناصر المحددة', { id: toastId });
    } catch { toast.error('تعذر حذف بعض العناصر', { id: toastId }); }
  };



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
        viewMode={viewMode}
        onViewModeChange={changeView}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        sortDirection={sortDirection}
        onToggleSortDirection={() => setSortDirection((value) => value === 'asc' ? 'desc' : 'asc')}
        onDropItem={handleDropItem}
      />

      {selected.size > 0 && <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm"><span className="font-medium">تم تحديد {selected.size}</span><div className="ms-auto flex gap-2"><Button size="sm" variant="destructive" onClick={handleBulkDelete}><Trash2 className="size-4" />حذف المحدد</Button><Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}><X className="size-4" />إلغاء التحديد</Button></div></div>}

      {isLoading ? (
        <div className={viewMode === 'grid' ? 'grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3' : 'space-y-2 rounded-xl border p-3'}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className={viewMode === 'grid' ? 'aspect-[4/3] w-full rounded-xl' : 'h-14 w-full rounded-lg'} />
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
          {viewMode === 'grid' ? <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3">
            {sortedFolders.map((folder) => (
              <FolderCard
                key={`folder-${folder.id}`}
                folder={folder}
                selected={selected.has(`folder:${folder.id}`)}
                onSelect={(item, checked) => selectItem(`folder:${item.id}`, checked)}
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
                // onDownload={() => {
                //   toast('تحميل المجلد غير متاح حالياً');
                // }}
                onDropItem={handleDropItem}
              />
            ))}

            {sortedFiles.map((file) => (
              <FileCard
                key={`file-${file.id}`}
                file={file}
                selected={selected.has(`file:${file.id}`)}
                onSelect={(item, checked) => selectItem(`file:${item.id}`, checked)}
                onDelete={(f) => setDeleteItem({ item: f, type: 'file' })}
                onDownload={handleDownloadFile}
                onPreview={setPreviewFile}
              />
            ))}
          </div> : <ExplorerList folders={sortedFolders} files={sortedFiles} selected={selected} onSelect={selectItem} onFolder={handleFolderClick} onPreview={setPreviewFile} onDownload={handleDownloadFile} onRename={(item, type) => setRenameItem({ item, type })} onDelete={(item, type) => setDeleteItem({ item, type })} />}

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
        onDownload={handleDownloadFile}
      />
    </div>
  );
}
