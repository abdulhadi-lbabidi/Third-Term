import * as React from "react"

import { cn } from "@/shared/lib/utils"
import { Button } from "@/components/ui/button"
import { ChevronLeftIcon, ChevronRightIcon, MoreHorizontalIcon } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select"

function Pagination({ className, ...props }: React.ComponentProps<"nav">) {
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      data-slot="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
      {...props}
    />
  )
}

function PaginationContent({
  className,
  ...props
}: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="pagination-content"
      className={cn("flex items-center gap-0.5", className)}
      {...props}
    />
  )
}

function PaginationItem({ ...props }: React.ComponentProps<"li">) {
  return <li data-slot="pagination-item" {...props} />
}

type PaginationLinkProps = {
  isActive?: boolean
} & Pick<React.ComponentProps<typeof Button>, "size"> &
  React.ComponentProps<"a">

function PaginationLink({
  className,
  isActive,
  size = "icon",
  ...props
}: PaginationLinkProps) {
  return (
    <Button
      variant={isActive ? "outline" : "ghost"}
      size={size}
      className={cn(className)}
      nativeButton={false}
      render={
        <a
          aria-current={isActive ? "page" : undefined}
          data-slot="pagination-link"
          data-active={isActive}
          {...props}
        />
      }
    />
  )
}

function PaginationPrevious({
  className,
  text = "Previous",
  ...props
}: React.ComponentProps<typeof PaginationLink> & { text?: string }) {
  return (
    <PaginationLink
      aria-label="Go to previous page"
      size="default"
      className={cn("pl-1.5!", className)}
      {...props}
    >
        <ChevronRightIcon data-icon="inline-start" />
      <span className="hidden sm:block">{text}</span>
    
    </PaginationLink>
  )
}

function PaginationNext({
  className,
  text = "Next",
  ...props
}: React.ComponentProps<typeof PaginationLink> & { text?: string }) {
  return (
    <PaginationLink
      aria-label="Go to next page"
      size="default"
      className={cn("pr-1.5!", className)}
      {...props}
    >
       
      <span className="hidden sm:block">{text}</span>
       <ChevronLeftIcon data-icon="inline-end" />
    
    </PaginationLink>
  )
}

function PaginationEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      aria-hidden
      data-slot="pagination-ellipsis"
      className={cn(
        "flex size-7 items-center justify-center sm:size-8 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <MoreHorizontalIcon
      />
      <span className="sr-only">More pages</span>
    </span>
  )
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
    for (let i = 1; i <= lastPage; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push('ellipsis');
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(lastPage - 1, currentPage + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (currentPage < lastPage - 2) pages.push('ellipsis');
    pages.push(lastPage);
  }
  return pages;
}

function SimplePagination({
  currentPage,
  totalPages,
  onPageChange,
  meta,
  limit,
  limitOptions,
  onLimitChange,
}: SimplePaginationProps) {
  const pageNumbers = getPageNumbers(currentPage, totalPages);

  return (
    <div className="sticky bottom-0 z-10 mt-auto flex items-center justify-center bg-transparent p-0 sm:justify-between sm:gap-4 sm:rounded-lg sm:border sm:border-border sm:bg-card/95 sm:p-4 sm:shadow-sm sm:backdrop-blur">
      {meta ? (
        <div className="hidden max-w-full flex-wrap items-center gap-3 text-xs text-muted-foreground sm:flex">
          <span>
            عرض {meta.from ?? 0} إلى {meta.to ?? 0} من إجمالي {meta.total ?? 0} عنصر
          </span>
          {limitOptions && onLimitChange && limit ? (
            <div className="flex items-center gap-2 border-r border-border/50 pr-3">
              <span>عرض</span>
              <Select value={limit.toString()} onValueChange={(v) => {
                onPageChange(1); // Reset page on limit change
                onLimitChange(Number(v));
              }}>
                <SelectTrigger className="h-7 w-[70px] text-xs" dir="ltr">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {limitOptions.map((opt) => (
                    <SelectItem key={opt} value={opt.toString()}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
        </div>
      ) : (
        <div />
      )}

      <Pagination className="mx-0 w-auto max-w-full overflow-x-auto">
        <PaginationContent className="gap-0">
          <PaginationItem>
            <PaginationPrevious
              text="السابق"
              onClick={(e) => {
                e.preventDefault();
                if (currentPage > 1) onPageChange(currentPage - 1);
              }}
              className={cn('size-8 p-0! sm:h-10 sm:w-auto sm:px-4!', currentPage <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer')}
            />
          </PaginationItem>

          {pageNumbers.map((p, idx) => (
            <PaginationItem key={idx} className={p === currentPage ? undefined : 'hidden sm:block'}>
              {p === 'ellipsis' ? (
                <PaginationEllipsis />
              ) : (
                <PaginationLink
                  isActive={p === currentPage}
                  onClick={(e) => {
                    e.preventDefault();
                    onPageChange(p);
                  }}
                  className="size-8 cursor-pointer sm:size-10"
                >
                  {p}
                </PaginationLink>
              )}
            </PaginationItem>
          ))}

          <PaginationItem>
            <PaginationNext
              text="التالي"
              onClick={(e) => {
                e.preventDefault();
                if (currentPage < totalPages) onPageChange(currentPage + 1);
              }}
              className={cn('size-8 p-0! sm:h-10 sm:w-auto sm:px-4!', currentPage >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer')}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  SimplePagination,
}
