import { CloudStorageExplorer } from './components/explorer/explorer-grid';

export function CloudStoragePage() {
  return (
    <div className="flex min-h-0 flex-1 overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-finance)]">
      <CloudStorageExplorer />
    </div>
  );
}
