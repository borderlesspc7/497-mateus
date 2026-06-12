"use client";

import { useEffect, useRef } from "react";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { panelInsetClass, secondaryActionClass } from "@/components/ui/list-panel-classes";

type PaginatedListFooterProps = {
  hasMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
  columns?: number;
  skeletonRows?: number;
};

export function PaginatedListFooter({
  hasMore,
  isLoadingMore,
  onLoadMore,
  columns = 4,
  skeletonRows = 3,
}: PaginatedListFooterProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore || isLoadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          onLoadMore();
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, onLoadMore]);

  if (!hasMore && !isLoadingMore) return null;

  return (
    <div className={`mt-2 space-y-4 ${panelInsetClass()}`}>
      {isLoadingMore ? <TableSkeleton rows={skeletonRows} columns={columns} /> : null}
      {hasMore ? (
        <>
          <div ref={sentinelRef} className="h-1" aria-hidden />
          <div className="flex justify-center">
            <button
              type="button"
              onClick={onLoadMore}
              disabled={isLoadingMore}
              className={secondaryActionClass()}
            >
              {isLoadingMore ? "Carregando..." : "Carregar mais"}
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
