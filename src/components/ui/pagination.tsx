import * as React from 'react';
import { MoreHorizontalIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/shared/lib/utils';

function Pagination({ className, ...props }: React.ComponentProps<'nav'>) {
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      data-slot="pagination"
      className={cn('flex w-full justify-center', className)}
      {...props}
    />
  );
}

function PaginationContent({ className, ...props }: React.ComponentProps<'ul'>) {
  return (
    <ul
      data-slot="pagination-content"
      className={cn('flex items-center gap-1', className)}
      {...props}
    />
  );
}

function PaginationItem(props: React.ComponentProps<'li'>) {
  return <li data-slot="pagination-item" {...props} />;
}

type PaginationLinkProps = {
  isActive?: boolean;
} & React.ComponentProps<'a'>;

function PaginationLink({ className, isActive, ...props }: PaginationLinkProps) {
  return (
    <Button
      variant={isActive ? 'default' : 'ghost'}
      size="icon"
      className={cn('size-9 rounded-md', className)}
      nativeButton={false}
      render={
        <a
          aria-current={isActive ? 'page' : undefined}
          data-slot="pagination-link"
          data-active={isActive}
          {...props}
        />
      }
    />
  );
}

function PaginationEllipsis() {
  return (
    <span aria-hidden className="flex size-9 items-center justify-center text-muted-foreground">
      <MoreHorizontalIcon className="size-4" />
      <span className="sr-only">صفحات إضافية</span>
    </span>
  );
}

export type PaginationMeta = {
  current_page?: number;
  last_page?: number;
  per_page?: number;
  from?: number | null;
  to?: number | null;
  total?: number;
};

export type SimplePaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  meta?: PaginationMeta;
  limit?: number;
  limitOptions?: number[];
  onLimitChange?: (limit: number) => void;
};

function getPageNumbers(currentPage: number, lastPage: number) {
  const pages: (number | 'ellipsis')[] = [];

  if (lastPage <= 7) {
    for (let page = 1; page <= lastPage; page += 1) pages.push(page);
    return pages;
  }

  pages.push(1);
  if (currentPage > 3) pages.push('ellipsis');

  const start = Math.max(2, currentPage - 1);
  const end = Math.min(lastPage - 1, currentPage + 1);
  for (let page = start; page <= end; page += 1) pages.push(page);

  if (currentPage < lastPage - 2) pages.push('ellipsis');
  pages.push(lastPage);
  return pages;
}

function SimplePagination({ currentPage, totalPages, onPageChange }: SimplePaginationProps) {
  const pageNumbers = getPageNumbers(currentPage, totalPages);

  if (totalPages <= 1) return null;

  return (
    <Pagination className="mt-4 overflow-x-auto py-1">
      <PaginationContent className="mx-auto w-max">
        {pageNumbers.map((pageNumber, index) => (
          <PaginationItem key={`${pageNumber}-${index}`}>
            {pageNumber === 'ellipsis' ? (
              <PaginationEllipsis />
            ) : (
              <PaginationLink
                isActive={pageNumber === currentPage}
                onClick={(event) => {
                  event.preventDefault();
                  onPageChange(pageNumber);
                }}
                className="cursor-pointer"
              >
                {pageNumber}
              </PaginationLink>
            )}
          </PaginationItem>
        ))}
      </PaginationContent>
    </Pagination>
  );
}

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  SimplePagination,
};
