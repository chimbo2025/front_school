import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface TablePaginationProps {
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  itemLabel?: string;
  pageSizeOptions?: number[];
}

/** Page numbers with 'gap' markers where pages are skipped. */
function buildPages(current: number, total: number): (number | 'gap')[] {
  if (total <= 1) return total === 1 ? [1] : [];

  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const wanted = new Set<number>([1, 2, total - 1, total, current]);
  if (current - 1 > 2) wanted.add(current - 1);
  if (current + 1 < total - 1) wanted.add(current + 1);

  const sorted = [...wanted].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);

  const out: (number | 'gap')[] = [];
  sorted.forEach((n, i) => {
    if (i > 0 && n - sorted[i - 1] > 1) out.push('gap');
    out.push(n);
  });
  return out;
}

export const TablePagination: React.FC<TablePaginationProps> = ({
  page,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  itemLabel = 'records',
  pageSizeOptions = [10, 25, 50, 100],
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const current = Math.min(Math.max(1, page), totalPages);

  const from = totalItems === 0 ? 0 : (current - 1) * pageSize + 1;
  const to = Math.min(current * pageSize, totalItems);

  const navBtn =
    'flex h-8 min-w-8 items-center justify-center rounded-lg border px-2 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40';

  const enabledBtn =
    'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900';

  const arrowBtn = `${navBtn} ${enabledBtn}`;

  return (
    <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Range summary + page size */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
        <span className="text-xs text-slate-500">
          Showing <span className="font-semibold text-slate-800">{from}</span>–
          <span className="font-semibold text-slate-800">{to}</span> of{' '}
          <span className="font-semibold text-slate-800">{totalItems}</span> {itemLabel}
        </span>

        <label className="flex items-center gap-2 text-xs text-slate-500">
          <span className="shrink-0">Rows</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/40 focus:border-[#7c3aed]"
          >
            {pageSizeOptions.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Page controls */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(1)}
          disabled={current === 1}
          className={arrowBtn}
          title="First page"
          aria-label="First page"
        >
          <ChevronsLeft className="h-4 w-4" />
        </button>
        <button
          onClick={() => onPageChange(current - 1)}
          disabled={current === 1}
          className={arrowBtn}
          title="Previous page"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-1">
          {buildPages(current, totalPages).map((p, idx) =>
            p === 'gap' ? (
              <span key={`gap-${idx}`} className="px-1 text-xs text-slate-400">
                …
              </span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                aria-current={p === current ? 'page' : undefined}
                className={`${navBtn} ${
                  p === current
                    ? 'border-[#7c3aed] bg-[#7c3aed] text-white shadow-sm'
                    : enabledBtn
                }`}
              >
                {p}
              </button>
            )
          )}
        </div>

        <button
          onClick={() => onPageChange(current + 1)}
          disabled={current === totalPages}
          className={arrowBtn}
          title="Next page"
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={current === totalPages}
          className={arrowBtn}
          title="Last page"
          aria-label="Last page"
        >
          <ChevronsRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};