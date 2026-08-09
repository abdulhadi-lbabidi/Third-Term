import { CloudStorageExplorer } from './components/explorer/explorer-grid';

export function CloudStoragePage() {
  return (
    <div className="flex min-h-0 min-w-0 w-full flex-1 overflow-hidden bg-card sm:rounded-xl sm:border sm:border-border sm:shadow-[var(--shadow-finance)]">
      <CloudStorageExplorer />
    </div>
  );
}
