import React from 'react';
import { Grade } from '../types';
import { formatNumber } from '../config/schoolConfig';

interface FeeStatementProps {
  grade: Grade;
  className?: string;
}

export const FeeStatement: React.FC<FeeStatementProps> = ({ grade, className = '' }) => {
  // Calculate group subtotals and grand total
  const groupsWithSubtotals = (grade.feeGroups || []).map((group) => {
    const subtotal = (group.items || []).reduce((sum, item) => sum + (item.amount || 0), 0);
    return {
      ...group,
      subtotal,
    };
  });

  const grandTotal = groupsWithSubtotals.reduce((sum, group) => sum + group.subtotal, 0);

  return (
    <div className={`bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm ${className}`}>
      {/* Green header bar */}
      <div className="bg-[#16a34a] text-white px-4 py-2.5 font-bold tracking-wider text-sm sm:text-base uppercase flex items-center justify-between">
        <span>{grade.name}</span>
        {grade.ageRange && (
          <span className="text-xs font-normal text-emerald-100 normal-case">
            {grade.ageRange}
          </span>
        )}
      </div>

      <div className="p-3 sm:p-4 space-y-3">
        {(groupsWithSubtotals || []).map((group) => (
          <div key={group.id} className="border-b border-slate-100 pb-2.5 last:border-b-0">
            {/* Small grey uppercase group title */}
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              {group.name}
            </div>

            {/* Rows with item name and amount */}
            <div className="space-y-1">
              {(group.items || []).map((item) => (
                <div key={item.id} className="flex justify-between items-center text-sm text-slate-800">
                  <span className="font-normal text-slate-700">{item.label}</span>
                  <span className="font-mono text-slate-800 tabular-nums">{formatNumber(item.amount)}</span>
                </div>
              ))}
            </div>

            {/* Smaller subtotal row with purple amount */}
            <div className="flex justify-between items-center text-xs mt-1 pt-1 border-t border-slate-100/80">
              <span className="text-slate-500 italic">Subtotal</span>
              <span className="font-mono font-semibold text-[#7c3aed] tabular-nums">
                {formatNumber(group.subtotal)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Final row: Total with amount in green and Tsh */}
      <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 flex justify-between items-center">
        <span className="font-bold text-slate-900 text-sm sm:text-base">Total</span>
        <span className="font-mono font-bold text-[#16a34a] text-base sm:text-lg tabular-nums">
          {formatNumber(grandTotal)} Tsh
        </span>
      </div>
    </div>
  );
};
