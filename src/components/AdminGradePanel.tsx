import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Receipt,
  Trash2,
  UserPlus,
  Users,
  AlertCircle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatNumber } from '../config/schoolConfig';
import { FeeGroup, Grade } from '../types';
import { FeeStatement } from './FeeStatement';

interface AdminGradePanelProps {
  grade: Grade;
  onRegisterInGrade: () => void;
  onViewStudents: (gradeId: string) => void;
}

const fieldCls =
  'w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/40 focus:border-[#7c3aed]';

export const AdminGradePanel: React.FC<AdminGradePanelProps> = ({
  grade,
  onRegisterInGrade,
  onViewStudents,
}) => {
  const { updateGrade, deleteGrade, students } = useApp();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const enrolled = students.filter((s) => s.gradeId === grade.id);
  const grandTotal = grade.feeGroups.reduce(
    (sum, g) => sum + g.items.reduce((s, i) => s + (i.amount || 0), 0),
    0
  );

  const commit = (feeGroups: FeeGroup[]) => updateGrade(grade.id, { feeGroups });

  const updateGroupName = (groupIndex: number, name: string) => {
    const next = grade.feeGroups.map((g, i) => (i === groupIndex ? { ...g, name } : g));
    commit(next);
  };

  const updateItem = (groupIndex: number, itemIndex: number, patch: { label?: string; amount?: number }) => {
    const next = grade.feeGroups.map((g, gi) =>
      gi === groupIndex
        ? { ...g, items: g.items.map((it, ii) => (ii === itemIndex ? { ...it, ...patch } : it)) }
        : g
    );
    commit(next);
  };

  const addItem = (groupIndex: number) => {
    const next = grade.feeGroups.map((g, gi) =>
      gi === groupIndex
        ? { ...g, items: [...g.items, { id: `item-${Date.now()}`, label: 'New Fee Item', amount: 0 }] }
        : g
    );
    commit(next);
  };

  const removeItem = (groupIndex: number, itemIndex: number) => {
    const next = grade.feeGroups.map((g, gi) =>
      gi === groupIndex ? { ...g, items: g.items.filter((_, ii) => ii !== itemIndex) } : g
    );
    commit(next);
  };

  const addGroup = () => {
    const next: FeeGroup[] = [
      ...grade.feeGroups,
      {
        id: `fg-${Date.now()}`,
        name: 'OTHER FEE',
        items: [{ id: `item-${Date.now()}`, label: 'New Fee Item', amount: 0 }],
      },
    ];
    commit(next);
  };

  const removeGroup = (groupIndex: number) => {
    if (!confirm(`Remove the "${grade.feeGroups[groupIndex].name}" fee group from ${grade.name}?`)) {
      return;
    }
    commit(grade.feeGroups.filter((_, gi) => gi !== groupIndex));
  };

  return (
    <>
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
      {/* ---------- Left: what the parent sees ---------- */}
      <div className="xl:col-span-5 space-y-3">
        <h4 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
          <FileText className="h-3.5 w-3.5" />
          Parent View / Statement
        </h4>
        <FeeStatement grade={grade} />
      </div>

      {/* ---------- Right: fee structure editor ---------- */}
      <div className="xl:col-span-7 space-y-3">
        <h4 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
          <Receipt className="h-3.5 w-3.5" />
          Edit Fee Structure
          <span className="ml-auto normal-case font-medium text-slate-400">
            Changes save instantly
          </span>
        </h4>

        <div className="space-y-3">
          {(grade.feeGroups || []).map((group, gi) => {
            const subtotal = (group.items || []).reduce((s, i) => s + (i.amount || 0), 0);
            return (
              <div key={group.id} className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                <div className="flex items-center gap-2 bg-slate-50 border-b border-slate-200 px-3 py-2">
                  <input
                    value={group.name}
                    onChange={(e) => updateGroupName(gi, e.target.value.toUpperCase())}
                    className="flex-1 bg-transparent text-[11px] font-bold uppercase tracking-wider text-slate-700 focus:outline-none focus:text-[#7c3aed]"
                    aria-label="Fee group name"
                  />
                  <span className="shrink-0 font-mono text-xs font-bold text-[#7c3aed] tabular-nums">
                    {formatNumber(subtotal)} Tsh
                  </span>
                  <button
                    onClick={() => removeGroup(gi)}
                    className="shrink-0 rounded-md p-1 text-slate-300 transition-colors hover:bg-red-50 hover:text-red-600"
                    title={`Remove ${group.name} group`}
                    aria-label={`Remove ${group.name} group`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="divide-y divide-slate-100">
                  {(group.items || []).map((item, ii) => (
                    <div key={item.id} className="flex items-center gap-2 px-3 py-2">
                      <input
                        value={item.label}
                        onChange={(e) => updateItem(gi, ii, { label: e.target.value })}
                        className={`${fieldCls} flex-1`}
                        placeholder="Fee item label"
                        aria-label="Fee item label"
                      />
                      <div className="relative w-32 shrink-0">
                        <input
                          type="number"
                          min={0}
                          step={1000}
                          value={item.amount}
                          onChange={(e) =>
                            updateItem(gi, ii, { amount: Number(e.target.value) || 0 })
                          }
                          className={`${fieldCls} pr-9 font-mono tabular-nums`}
                          aria-label="Fee item amount"
                        />
                        <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                          Tsh
                        </span>
                      </div>
                      <button
                        onClick={() => removeItem(gi, ii)}
                        className="shrink-0 rounded-md p-1.5 text-slate-300 transition-colors hover:bg-red-50 hover:text-red-600"
                        title={`Remove ${item.label}`}
                        aria-label={`Remove ${item.label}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="px-3 py-2 border-t border-slate-100 bg-slate-50/50">
                  <button
                    onClick={() => addItem(gi)}
                    className="flex items-center gap-1 text-[11px] font-semibold text-[#7c3aed] transition-colors hover:text-[#6d28d9]"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Add item to {group.name}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={addGroup}
          className="w-full rounded-xl border border-dashed border-slate-300 py-2.5 text-xs font-semibold text-slate-500 transition-colors hover:border-[#7c3aed] hover:bg-purple-50/40 hover:text-[#7c3aed]"
        >
          + Add Fee Group
        </button>
      </div>

      {/* ---------- Footer: enrolled students + actions ---------- */}
      <div className="xl:col-span-12 flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-[#16a34a]">
            <Users className="h-4 w-4" />
          </span>
          <div>
            <div className="text-xs font-bold text-slate-900">
              {enrolled.length} student{enrolled.length === 1 ? '' : 's'} enrolled
              <span className="ml-2 font-mono font-semibold text-slate-500">
                {formatNumber(grandTotal)} Tsh / year
              </span>
            </div>
            <div className="text-[11px] text-slate-500">
              {enrolled.length > 0
                ? enrolled
                    .slice(0, 4)
                    .map((s) => `${s.firstName} ${s.lastName}`)
                    .join(', ') + (enrolled.length > 4 ? ` +${enrolled.length - 4} more` : '')
                : 'No students in this classroom yet.'}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => onViewStudents(grade.id)}
            className="py-2 px-3 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            View Students
          </button>
          <button
            onClick={onRegisterInGrade}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-[#16a34a] text-xs font-semibold text-white transition-colors hover:bg-emerald-600"
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>Register in {grade.name}</span>
          </button>
          <button
            onClick={() => {
              if (enrolled.length > 0) {
                alert(`Cannot delete "${grade.name}": ${enrolled.length} student(s) enrolled. Reassign them first.`);
                return;
              }
              setShowDeleteConfirm(true);
            }}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-red-50 text-red-600 border border-red-200 text-xs font-semibold transition-colors hover:bg-red-100"
            disabled={enrolled.length > 0}
            title={enrolled.length > 0 ? `${enrolled.length} student(s) enrolled - cannot delete` : 'Delete this grade'}
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Delete Grade</span>
          </button>
        </div>
      </div>
    </div>

      {/* Delete Grade Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs">
        <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
          <div className="flex items-center gap-3 p-5 bg-red-50 border-b border-red-100">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
              <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="font-bold text-base text-red-900">Delete Grade</h3>
          </div>
          <div className="p-5 space-y-4">
            <p className="text-slate-700">
              Are you sure you want to delete <strong className="text-slate-900">{grade.name}</strong> and its fee structure?
            </p>
            <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg">
              This action cannot be undone. All fee groups and items will be permanently removed.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    await deleteGrade(grade.id);
                  } catch (err) {
                    alert(err instanceof Error ? err.message : 'Failed to delete grade');
                  }
                  setShowDeleteConfirm(false);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700"
              >
                Delete Grade
              </button>
            </div>
</div>
      </div>
    </div>
    )}
  </>
  );
};