import React, { useEffect, useState } from 'react';
import { ChevronDown, Wallet, Phone } from 'lucide-react';
import { Grade } from '../types';
import { formatNumber, schoolConfig } from '../config/schoolConfig';

interface GradeFeeAccordionProps {
  grades: Grade[];
  /** Grade that starts unfolded. Defaults to the first grade in the list. */
  defaultOpenId?: string | null;
  /** Swap the open/fold logic for an externally controlled value. */
  openId?: string | null;
  /** Receives the newly open grade id, or null when everything collapses. */
  onToggle?: (gradeId: string | null) => void;
  /** Rendered inside the folded area, under the fee rows (e.g. a CTA). */
  renderFooter?: (grade: Grade) => React.ReactNode;
  /** Extra cells shown in the header row. Used by the 'row' variant. */
  renderHeaderExtra?: (grade: Grade) => React.ReactNode;
  /** Replaces the default fee breakdown body. */
  renderPanel?: (grade: Grade) => React.ReactNode;
  /**
   * 'card' = standalone rounded cards (public landing page).
   * 'row'  = compact stacked rows inside one bordered container (admin tables).
   */
  variant?: 'card' | 'row';
  /**
   * 'row' variant only: draw the outer container (border, radius, shadow).
   * Set false when the rows sit directly on an already-framed surface, such as
   * the edge-docked fee drawer, so no nested card outline appears.
   */
  framed?: boolean;
  /**
   * Column layout for the 'row' variant. The first entry sizes the grade cell
   * and is rendered internally; the rest label the header strip only, so
   * `renderHeaderExtra` must emit one matching cell per remaining entry.
   * A trailing column is always reserved for the fold chevron.
   */
  columns?: AccordionColumn[];
}

export interface AccordionColumn {
  label: string;
  span: string;
  align?: 'left' | 'right';
}

const DEFAULT_COLUMNS: AccordionColumn[] = [
  { label: 'Classroom / Grade', span: 'lg:col-span-4' },
  { label: 'Age', span: 'lg:col-span-2' },
  { label: 'Enrolled', span: 'lg:col-span-2' },
  { label: 'Fee Groups', span: 'lg:col-span-2' },
  { label: 'Total / Year', span: 'lg:col-span-1' },
];

const totalOf = (grade: Grade) =>
  grade.feeGroups.reduce(
    (sum, group) => sum + group.items.reduce((s, item) => s + (item.amount || 0), 0),
    0
  );

const countItems = (grade: Grade) =>
  grade.feeGroups.reduce((sum, group) => sum + group.items.length, 0);

export const GradeFeeAccordion: React.FC<GradeFeeAccordionProps> = ({
  grades,
  defaultOpenId,
  openId,
  onToggle,
  renderFooter,
  renderHeaderExtra,
  renderPanel,
  variant = 'card',
  framed = true,
  columns = DEFAULT_COLUMNS,
}) => {
  const [internalOpenId, setInternalOpenId] = useState<string | null>(
    defaultOpenId ?? grades[0]?.id ?? null
  );

  const isControlled = openId !== undefined;
  const activeId = isControlled ? openId : internalOpenId;

  useEffect(() => {
    if (defaultOpenId === undefined) return;
    setInternalOpenId(defaultOpenId);
  }, [defaultOpenId]);

  const handleToggle = (gradeId: string) => {
    const next = activeId === gradeId ? null : gradeId;
    if (!isControlled) setInternalOpenId(next);
    onToggle?.(next);
  };

  if (grades.length === 0) {
    return (
      <div className="text-center text-sm text-slate-500 bg-white border border-dashed border-slate-300 rounded-2xl py-10">
        No grades configured yet.
      </div>
    );
  }

  const isRow = variant === 'row';

  return (
    <div
      className={
        isRow
          ? framed
            ? 'bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-200'
            : 'divide-y divide-slate-200'
          : 'space-y-3'
      }
    >
      {/* Column headings (row variant, desktop only) */}
      {isRow && (
        <div className="hidden lg:grid lg:grid-cols-12 lg:items-center lg:gap-4 bg-slate-50 px-5 py-2.5">
          {columns.map((col, i) => (
            <div
              key={`${col.label}-${i}`}
              className={`text-[10px] font-bold uppercase tracking-wider text-slate-500 ${col.span} ${
                col.align === 'right' ? 'text-right' : ''
              }`}
            >
              {col.label}
            </div>
          ))}
          <div className="lg:col-span-1" aria-hidden="true" />
        </div>
      )}

      {grades.map((grade) => {
        const isOpen = activeId === grade.id;
        const panelId = `grade-fee-panel-${grade.id}`;
        const buttonId = `grade-fee-button-${grade.id}`;
        const grandTotal = totalOf(grade);

        return (
          <div
            key={grade.id}
            className={
              isRow
                ? `transition-colors ${isOpen ? 'bg-purple-50/30' : 'hover:bg-slate-50/70'}`
                : `bg-white rounded-2xl border shadow-sm overflow-hidden transition-all duration-300 ${
                    isOpen
                      ? 'border-[#7c3aed]/40 ring-1 ring-[#7c3aed]/20 shadow-md'
                      : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
                  }`
            }
          >
            {/* ---------- Fold / Unfold header ---------- */}
            {isRow ? (
              <button
                id={buttonId}
                type="button"
                onClick={() => handleToggle(grade.id)}
                aria-expanded={isOpen}
                aria-controls={panelId}
                className="w-full text-left px-4 sm:px-5 py-3.5 lg:grid lg:grid-cols-12 lg:items-center lg:gap-4 flex items-center gap-3 sm:gap-4 cursor-pointer select-none bg-transparent"
              >
                <span className={`${columns[0]?.span ?? 'lg:col-span-4'} flex items-center gap-3 min-w-0`}>
                  <span
                    className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-mono font-extrabold text-sm transition-colors duration-200 ${
                      isOpen
                        ? 'bg-[#7c3aed] text-white shadow-sm'
                        : 'bg-emerald-50 text-[#16a34a]'
                    }`}
                  >
                    {grade.name.replace(/[^0-9]/g, '') || '•'}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-slate-900 truncate">
                      {grade.name}
                    </span>
                    <span className="block text-[11px] text-slate-500 truncate">
                      {grade.description || `${countItems(grade)} fee items`}
                    </span>
                  </span>
                </span>

                {renderHeaderExtra?.(grade)}

                <span
                  className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-300 lg:col-span-1 ${
                    isOpen
                      ? 'bg-[#7c3aed]/10 text-[#7c3aed] rotate-180'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                  aria-hidden="true"
                >
                  <ChevronDown className="w-4 h-4" />
                </span>
              </button>
            ) : (
              <h3 className="m-0">
                <button
                  id={buttonId}
                  type="button"
                  onClick={() => handleToggle(grade.id)}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  className="w-full text-left px-4 sm:px-5 py-4 flex items-center gap-3 sm:gap-4 cursor-pointer select-none bg-transparent"
                >
                  <span
                    className={`shrink-0 w-11 h-11 rounded-xl flex items-center justify-center font-mono font-extrabold text-sm transition-colors duration-300 ${
                      isOpen
                        ? 'bg-[#7c3aed] text-white shadow-sm'
                        : 'bg-emerald-50 text-[#16a34a]'
                    }`}
                  >
                    {grade.name.replace(/[^0-9]/g, '') || '•'}
                  </span>

                  <span className="flex-1 min-w-0">
                    <span className="flex items-center gap-2 flex-wrap">
                      <span className="text-base sm:text-lg font-bold text-slate-900">
                        {grade.name}
                      </span>
                      {grade.ageRange && (
                        <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                          Ages {grade.ageRange}
                        </span>
                      )}
                    </span>
                    <span className="block text-sm text-slate-500 mt-0.5 truncate">
                      {grade.description ||
                        `${countItems(grade)} fee items · Academic Year 2026/2027`}
                    </span>
                  </span>

                  <span className="text-right shrink-0 hidden sm:block">
                    <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Total / year
                    </span>
                    <span className="block font-mono font-bold text-[#16a34a] text-base tabular-nums">
                      {formatNumber(grandTotal)} Tsh
                    </span>
                  </span>

                  <span
                    className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-300 ${
                      isOpen
                        ? 'bg-[#7c3aed]/10 text-[#7c3aed] rotate-180'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                    aria-hidden="true"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </span>
                </button>
              </h3>
            )}

            {/* ---------- Collapsible body ---------- */}
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
              }`}
            >
              <div className="overflow-hidden">
                {renderPanel ? (
                  <div className="px-4 sm:px-5 pb-5 pt-4 border-t border-slate-200">{renderPanel(grade)}</div>
                ) : (
                  <div className="px-4 sm:px-5 pb-5 pt-1 border-t border-slate-100">
                    {grade.description && (
                      <p className="text-sm text-slate-600 leading-relaxed mt-3">
                        {grade.description}
                      </p>
                    )}

                    {/* Fee groups */}
                    <div className="mt-3 space-y-3">
                      {grade.feeGroups.map((group) => {
                        const subtotal = group.items.reduce(
                          (sum, item) => sum + (item.amount || 0),
                          0
                        );
                        return (
                          <div
                            key={group.id}
                            className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/60"
                          >
                            <div className="px-3 py-2 bg-slate-100/80 flex items-center justify-between">
                              <span className="text-sm font-bold text-slate-600 uppercase tracking-wider">
                                {group.name}
                              </span>
                              <span className="font-mono text-sm font-semibold text-[#7c3aed] tabular-nums">
                                {formatNumber(subtotal)} Tsh
                              </span>
                            </div>
                            <div className="divide-y divide-slate-100">
                              {group.items.map((item) => (
                                <div
                                  key={item.id}
                                  className="px-3 py-2 flex items-center justify-between gap-3 text-sm sm:text-base"
                                >
                                  <span className="text-slate-700">{item.label}</span>
                                  <span className="font-mono text-slate-800 tabular-nums shrink-0">
                                    {formatNumber(item.amount)} Tsh
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Grand total */}
                    <div className="mt-4 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                      <span className="flex items-center gap-2 text-sm font-bold text-emerald-900 uppercase tracking-wider">
                        <Wallet className="w-4 h-4 text-[#16a34a]" />
                        Total per year
                      </span>
                      <span className="font-mono font-extrabold text-[#16a34a] text-base sm:text-lg tabular-nums">
                        {formatNumber(grandTotal)} Tsh
                      </span>
                    </div>

                    {renderFooter?.(grade)}

                    <p className="mt-3 text-sm text-slate-500 flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>
                        Fee questions? Call the bursar on{' '}
                        <a
                          href={`tel:${schoolConfig.phone.replace(/\s+/g, '')}`}
                          className="font-semibold text-emerald-700 underline"
                        >
                          {schoolConfig.phone}
                        </a>
                      </span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};