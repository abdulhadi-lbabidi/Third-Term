import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { UploadCloud } from 'lucide-react';
import { useDirectories, useDirectory, useMoveItems, useDeleteDirectory, useDeleteFile, useCopyFiles } from '../../hooks/cloud-storage.hooks';
import type { Directory, CloudFile, DirectoryListParams, DirectorySortField, ExplorerSortBy, ExplorerSortDirection, ExplorerViewMode } from '../../types';
import { ExplorerHeader } from './explorer-header';
import { FolderCard } from './folder.card';
import { FileCard } from './file.card';
import { CreateFolderDialog } from './create-folder.dialog';
import { RenameItemDialog } from './rename-item.dialog';
import { DeleteItemDialog } from './delete-item.dialog';
import { UploadFilesDialog } from './upload-files.dialog';
import { FilePreviewDialog } from '../FilePreviewDialog';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { DeleteConfirmDialog } from '@/shared/components/ui/delete-confirm-dialog';
import { ExplorerList } from './explorer-list';
import { getFileType, resolveFileUrl } from '../../utils/file-utils';
import { SelectionToolbar } from './selection-toolbar';
import { DirectoryFiltersTrigger, DirectoryFiltersContent, type DirectoryFilterValue } from './directory-filters';

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

const FILE_CLIPBOARD_KEY = 'cloud-storage-file-clipboard';

interface FileClipboard {
  version: 2;
  mode: 'copy' | 'cut';
  copiedAt: string;
  items: Array<{ type: 'file' | 'folder'; id: number; name: string }>;
}

function readFileClipboard(): FileClipboard | null {
  try {
    const value = localStorage.getItem(FILE_CLIPBOARD_KEY);
    if (!value) return null;
    const parsed = JSON.parse(value) as Partial<FileClipboard>;
    if (parsed.version !== 2 || (parsed.mode !== 'copy' && parsed.mode !== 'cut') || !Array.isArray(parsed.items)) return null;
    const items = parsed.items.filter((item) => (item?.type === 'file' || item?.type === 'folder') && Number.isFinite(item?.id) && typeof item?.name === 'string');
    return items.length ? { version: 2, mode: parsed.mode, copiedAt: parsed.copiedAt ?? '', items } : null;
  } catch {
    return null;
  }
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

function flattenDirectories(directories: Directory[]): Directory[] {
  const result: Directory[] = [];
  const visited = new Set<number>();

  const visit = (directory: Directory) => {
    if (visited.has(directory.id)) return;
    visited.add(directory.id);
    result.push(directory);
    (directory.children ?? []).forEach(visit);
  };

  directories.forEach(visit);
  return result;
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
  const perPage = 20;
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [loadedRootDirectories, setLoadedRootDirectories] = useState<Directory[]>([]);
  const [lastPage, setLastPage] = useState(1);

  // ── Breadcrumbs ──
  const [breadcrumbs, setBreadcrumbs] = useState<{ id: number | null; name: string }[]>([
    { id: null, name: 'الرئيسية' },
  ]);

  // ── Search ──
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const normalizedSearch = debouncedSearch.trim();
  const isSearching = normalizedSearch.length > 0;

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
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [fileClipboard, setFileClipboard] = useState<FileClipboard | null>(() => readFileClipboard());
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState<DirectoryFilterValue>(() => ({ projectId: projectId ?? undefined }));
  const [appliedFilters, setAppliedFilters] = useState<DirectoryFilterValue>(() => ({ projectId: projectId ?? undefined }));

  // ── Root level: GET /api/directories?paginate=1&per_page=10&page=1 ──
  const directorySortField: DirectorySortField = sortBy === 'date' ? 'created_at' : 'dir_name';
  const rootParams: DirectoryListParams = {
    paginate: !currentDirId && isSearching ? 0 : 1,
    page: !currentDirId && isSearching ? undefined : page,
    per_page: !currentDirId && isSearching ? undefined : perPage,
    'filter[project_id]': projectId ?? appliedFilters.projectId,
    sort: sortDirection === 'desc' ? `-${directorySortField}` : directorySortField,
  };

  const {
    data: rootData,
    isLoading: isLoadingRoot,
    isError: isRootError,
    error: rootError,
    isFetching: isFetchingRoot,
  } = useDirectories(rootParams, !currentDirId);

  // ── Inside a folder: GET /api/directories/{id} ──
  const {
    data: currentDirectory,
    isLoading: isLoadingDir,
    isError: isDirError,
    error: dirError,
  } = useDirectory(currentDirId);

  const { mutate: moveItems, mutateAsync: moveItemsAsync, isPending: isMoving } = useMoveItems();
  const { mutateAsync: copyFiles, isPending: isCopying } = useCopyFiles();
  const isPasting = isMoving || isCopying;
  const { mutateAsync: deleteDirectory } = useDeleteDirectory();
  const { mutateAsync: deleteFile } = useDeleteFile();

  const isLoading = currentDirId ? isLoadingDir : isLoadingRoot;

  useEffect(() => {
    if (!currentDirId) setPage(1);
  }, [currentDirId, debouncedSearch, projectId, appliedFilters, sortBy, sortDirection]);

  useEffect(() => {
    if (Array.isArray(rootData)) {
      setLoadedRootDirectories(rootData);
      setLastPage(1);
      return;
    }

    if (!rootData || typeof rootData !== 'object' || !('data' in rootData)) return;
    const response = rootData as unknown as PaginatedResponse<Directory>;
    setLastPage(response.meta.last_page);
    setLoadedRootDirectories((current) => {
      if (response.meta.current_page === 1) return response.data;
      const byId = new Map(current.map((directory) => [directory.id, directory]));
      response.data.forEach((directory) => byId.set(directory.id, directory));
      return [...byId.values()];
    });
  }, [rootData]);

  useEffect(() => {
    const target = loadMoreRef.current;
    const root = scrollContainerRef.current;
    if (!target || !root || currentDirId || isSearching) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !isFetchingRoot && page < lastPage) {
        setPage((current) => current + 1);
      }
    }, { root, rootMargin: '160px 0px', threshold: 0 });

    observer.observe(target);
    return () => observer.disconnect();
  }, [currentDirId, isFetchingRoot, isSearching, lastPage, page]);

  useEffect(() => {
    if (projectId == null) return;
    setDraftFilters((current) => ({ ...current, projectId }));
    setAppliedFilters((current) => ({ ...current, projectId }));
  }, [projectId]);

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
      const ancestors = currentDirectory.ancestors?.length
        ? currentDirectory.ancestors
        : (() => {
          const chain: Directory[] = [];
          const visited = new Set<number>();
          let parent = currentDirectory.parent;

          while (parent && !visited.has(parent.id)) {
            visited.add(parent.id);
            chain.unshift(parent);
            parent = parent.parent;
          }

          return chain;
        })();
      const newBreadcrumbs = [
        { id: null, name: 'الرئيسية' },
        ...ancestors.map((directory) => ({ id: directory.id, name: directory.dir_name })),
        { id: currentDirId, name: currentDirectory.dir_name },
      ];
      setBreadcrumbs(newBreadcrumbs);
    } else if (!currentDirId) {
      setBreadcrumbs([{ id: null, name: 'الرئيسية' }]);
    }
  }, [currentDirId, currentDirectory]);

  // ── Extract folders and files ──
  const rootDirectories = useMemo<Directory[]>(() => {
    return loadedRootDirectories;
  }, [loadedRootDirectories]);

  const searchableRootDirectories = useMemo(
    () => isSearching ? flattenDirectories(rootDirectories) : rootDirectories,
    [isSearching, rootDirectories]
  );

  const currentFolders: Directory[] = useMemo(() => {
    if (currentDirId) {
      return currentDirectory?.children ?? [];
    }
    return searchableRootDirectories;
  }, [currentDirId, currentDirectory, searchableRootDirectories]);

  const currentFiles: CloudFile[] = useMemo(() => {
    if (currentDirId) {
      return currentDirectory?.files ?? [];
    }
    if (isSearching) {
      return searchableRootDirectories.flatMap((directory) => directory.files ?? []);
    }
    return [];
  }, [currentDirId, currentDirectory, isSearching, searchableRootDirectories]);

  // ── Handlers ──
  const handleDropItem = useCallback(
    (targetFolderId: number | null, item: { type: 'file' | 'folder'; id: number; data?: any }) => {
      const draggedKey = `${item.type}:${item.id}`;
      const itemsToMove = selected.has(draggedKey)
        ? [...selected].map((key) => {
          const [type, id] = key.split(':');
          return { type: type as 'file' | 'folder', id: Number(id) };
        })
        : [item];
      const movableItems = itemsToMove.filter(
        (selectedItem) => !(selectedItem.type === 'folder' && selectedItem.id === targetFolderId)
      );

      if (!movableItems.length) return;
      moveItems(
        { targetDirId: targetFolderId, itemIds: movableItems },
        {
          onSuccess: () => {
            setSelected(new Set());
            toast.success(movableItems.length > 1 ? `تم نقل ${movableItems.length} عناصر` : 'تم نقل العنصر');
          },
          onError: () => toast.error('تعذر نقل العناصر'),
        }
      );
    },
    [moveItems, selected]
  );

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setPage(1);
  }, []);

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
    () => normalizedSearch
      ? currentFolders.filter((directory) =>
        `${directory.dir_name} ${directory.dir_path}`.toLocaleLowerCase().includes(normalizedSearch.toLocaleLowerCase())
      )
      : currentFolders,
    [currentFolders, normalizedSearch]
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

  const visibleItemKeys = useMemo(() => [
    ...sortedFolders.map((folder) => `folder:${folder.id}`),
    ...sortedFiles.map((file) => `file:${file.id}`),
  ], [sortedFolders, sortedFiles]);
  const allVisibleItemsSelected = visibleItemKeys.length > 0
    && visibleItemKeys.every((key) => selected.has(key));

  const changeView = (mode: ExplorerViewMode) => { setViewMode(mode); localStorage.setItem('cloud-explorer-view', mode); };
  const selectItem = (key: string, checked: boolean) => {
    setSelected((current) => {
      const next = new Set(current);
      if (checked) next.add(key);
      else next.delete(key);
      return next;
    });
  };
  const toggleSelectAll = () => setSelected((current) => {
    const next = new Set(current);
    if (visibleItemKeys.every((key) => next.has(key))) {
      visibleItemKeys.forEach((key) => next.delete(key));
    } else {
      visibleItemKeys.forEach((key) => next.add(key));
    }
    return next;
  });
  const copySelectedFiles = () => {
    const files = currentFiles
      .filter((file) => selected.has(`file:${file.id}`))
      .map((file) => ({ type: 'file' as const, id: file.id, name: file.file_name }));
    if (!files.length) {
      toast.error('حدد ملفًا واحدًا على الأقل للنسخ');
      return;
    }

    const clipboard: FileClipboard = { version: 2, mode: 'copy', copiedAt: new Date().toISOString(), items: files };
    localStorage.setItem(FILE_CLIPBOARD_KEY, JSON.stringify(clipboard));
    setFileClipboard(clipboard);
    toast.success(`تم نسخ ${files.length} ملف إلى الحافظة`);
  };
  const cutSelectedItems = () => {
    const items: FileClipboard['items'] = [
      ...currentFolders
        .filter((folder) => selected.has(`folder:${folder.id}`))
        .map((folder) => ({ type: 'folder' as const, id: folder.id, name: folder.dir_name })),
      ...currentFiles
        .filter((file) => selected.has(`file:${file.id}`))
        .map((file) => ({ type: 'file' as const, id: file.id, name: file.file_name })),
    ];
    if (!items.length) return;

    const clipboard: FileClipboard = { version: 2, mode: 'cut', copiedAt: new Date().toISOString(), items };
    localStorage.setItem(FILE_CLIPBOARD_KEY, JSON.stringify(clipboard));
    setFileClipboard(clipboard);
    toast.success(`تم قص ${items.length} عنصر إلى الحافظة`);
  };
  const pasteCopiedFiles = async () => {
    const clipboard = readFileClipboard();
    if (!clipboard?.items.length || isPasting) return;

    const toastId = toast.loading(`جاري لصق ${clipboard.items.length} عنصر...`);
    try {
      if (clipboard.mode === 'copy') {
        await copyFiles({
          fileIds: clipboard.items.map((item) => item.id),
          targetDirectoryId: currentDirId,
        });
      } else {
        await moveItemsAsync({
          targetDirId: currentDirId,
          itemIds: clipboard.items.map(({ type, id }) => ({ type, id })),
        });
      }
      localStorage.removeItem(FILE_CLIPBOARD_KEY);
      setFileClipboard(null);
      toast.success(`تم لصق ${clipboard.items.length} عنصر`, { id: toastId });
    } catch {
      toast.error('تعذر لصق بعض الملفات', { id: toastId });
    }
  };
  const exitClipboardMode = () => {
    localStorage.removeItem(FILE_CLIPBOARD_KEY);
    setFileClipboard(null);
  };
  const handleBulkDelete = async () => {
    if (!selected.size || isBulkDeleting) return;
    setIsBulkDeleting(true);
    const toastId = toast.loading('جاري حذف العناصر...');
    try {
      await Promise.all([...selected].map((key) => { const [type, id] = key.split(':'); return type === 'folder' ? deleteDirectory(Number(id)) : deleteFile({ directoryId: currentDirId!, fileId: Number(id) }); }));
      setSelected(new Set());
      setIsBulkDeleteOpen(false);
      toast.success('تم حذف العناصر المحددة', { id: toastId });
    } catch { toast.error('تعذر حذف بعض العناصر', { id: toastId }); }
    finally { setIsBulkDeleting(false); }
  };



  return (
    <div className="flex min-h-0 w-full flex-1 flex-col animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="shrink-0 border-b border-border bg-card">
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
          onSearchChange={handleSearchChange}
          viewMode={viewMode}
          onViewModeChange={changeView}
          sortBy={sortBy}
          onSortByChange={setSortBy}
          sortDirection={sortDirection}
          onToggleSortDirection={() => setSortDirection((value) => value === 'asc' ? 'desc' : 'asc')}
          selectionTools={(
            <SelectionToolbar
              selectedCount={selected.size}
              hasItems={visibleItemKeys.length > 0}
              allItemsSelected={allVisibleItemsSelected}
              onToggleSelectAll={toggleSelectAll}
              onClearSelection={() => setSelected(new Set())}
              onExitClipboard={exitClipboardMode}
              onCopy={copySelectedFiles}
              onCut={cutSelectedItems}
              clipboardCount={fileClipboard?.items.length ?? 0}
              onPaste={pasteCopiedFiles}
              isPasting={isPasting}
              onDelete={() => setIsBulkDeleteOpen(true)}
            />
          )}
          filterTools={(
            <DirectoryFiltersTrigger
              open={isFilterOpen}
              onOpenChange={setIsFilterOpen}
              activeFilterCount={Number(projectId == null && appliedFilters.projectId != null)}
            />
          )}
          onDropItem={handleDropItem}
        />
      </div>

      {isFilterOpen && (
        <div className="px-2.5 pt-2.5 sm:px-5 sm:pt-5 pb-0 shrink-0">
          <DirectoryFiltersContent
            open={isFilterOpen}
            onOpenChange={setIsFilterOpen}
            value={draftFilters}
            onChange={setDraftFilters}
            projectIdLocked={projectId != null}
            onApply={() => {
              setAppliedFilters(draftFilters);
              setPage(1);
            }}
            onReset={() => {
              const resetValue = { projectId: projectId ?? undefined };
              setDraftFilters(resetValue);
              setAppliedFilters(resetValue);
              setPage(1);
            }}
          />
        </div>
      )}

      <div ref={scrollContainerRef} className="min-h-0 min-w-0 flex-1 overflow-y-auto bg-muted/15 p-2.5 sm:p-5">
        {isLoading ? (
          <div className={viewMode === 'grid' ? 'grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-2.5 sm:grid-cols-[repeat(auto-fill,minmax(150px,1fr))] sm:gap-3' : 'space-y-2 rounded-xl border p-2 sm:p-3'}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className={viewMode === 'grid' ? 'aspect-[4/3] w-full rounded-xl' : 'h-14 w-full rounded-lg'} />
            ))}
          </div>
        ) : filteredFolders.length === 0 && filteredFiles.length === 0 ? (
          <div className="flex min-h-full flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/60 px-4 py-20 text-center">
            <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <UploadCloud className="size-8" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">المجلد فارغ</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">لا توجد ملفات أو مجلدات هنا. أنشئ مجلدًا جديدًا أو ارفع ملفات للبدء.</p>
          </div>
        ) : (
          <>
            {viewMode === 'grid' ? <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-2.5 sm:grid-cols-[repeat(auto-fill,minmax(160px,1fr))] sm:gap-3">
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

            {!currentDirId && !isSearching ? (
              <div ref={loadMoreRef} className="flex h-12 items-center justify-center" aria-hidden>
                {isFetchingRoot && page > 1 ? <Skeleton className="h-2 w-24 rounded-full" /> : null}
              </div>
            ) : null}

          </>
        )}
      </div>

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

      <DeleteConfirmDialog
        isOpen={isBulkDeleteOpen}
        onClose={() => !isBulkDeleting && setIsBulkDeleteOpen(false)}
        onConfirm={handleBulkDelete}
        isDeleting={isBulkDeleting}
        title="تأكيد حذف العناصر المحددة"
        description={`سيتم حذف ${selected.size} عنصر بشكل نهائي. لا يمكن التراجع عن هذا الإجراء.`}
        confirmLabel="حذف العناصر"
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
