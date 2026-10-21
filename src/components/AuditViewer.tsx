import React, { useMemo, useState } from 'react';
import { ScrollText, Filter } from 'lucide-react';
import { AuditEntry, AuditAction } from '../types';
import { useApp } from '../context/AppContext';

const ACTION_STYLES: Partial<Record<AuditAction, string>> = {
  ALLOCATE: 'bg-emerald-100 text-emerald-700',
  REALLOCATE: 'bg-amber-100 text-amber-700',
  PAYMENT_CREATE: 'bg-blue-100 text-blue-700',
  PAYMENT_DELETE: 'bg-red-100 text-red-700',
  CLAIM_SUBMIT: 'bg-purple-100 text-purple-700',
  CLAIM_APPROVE: 'bg-emerald-100 text-emerald-700',
  CLAIM_REJECT: 'bg-red-100 text-red-700',
  CLAIM_NOT_FOUND: 'bg-slate-100 text-slate-600',
  CSV_IMPORT: 'bg-indigo-100 text-indigo-700',
  ROW_ASSIGN: 'bg-sky-100 text-sky-700',
  MANUAL_ADJUST: 'bg-orange-100 text-orange-700',
  SETTINGS_CHANGE: 'bg-slate-100 text-slate-700',
};

interface AuditViewerProps {
  studentId?: string;
  className?: string;
}

export const AuditViewer: React.FC<AuditViewerProps> = ({ studentId, className = '' }) => {
  const { auditEntries, students } = useApp();
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const [query, setQuery] = useState('');

  const entries: AuditEntry[] = useMemo(() => {
    let list = auditEntries;
    if (studentId) list = list.filter((e) => e.studentId === studentId);
    if (actionFilter !== 'ALL') list = list.filter((e) => e.action === actionFilter);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (e) =>
          e.performedBy.toLowerCase().includes(q) ||
          (e.reason || '').toLowerCase().includes(q) ||
          (e.studentName || e.studentId || '').toLowerCase().includes(q) ||
          (e.paymentId || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [auditEntries, studentId, actionFilter, query]);

  const studentLabel = (e: AuditEntry) => {
    const id = e.studentId;
    if (!id) return '—';
    const s = students.find((st) => st.id === id);
    return s ? `${s.firstName} ${s.lastName}` : e.studentName || id;
  };

  const actions = useMemo(() => [...new Set(auditEntries.map((e) => e.action))].sort(), [auditEntries]);

  return (
    <div className={`bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden ${className}`}>
      <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center text-slate-700">
            <ScrollText className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Audit Trail</h3>
            <p className="text-xs text-slate-500">{entries.length} entr{entries.length === 1 ? 'y' : 'ies'} — every approval, allocation and import is recorded</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search reason, user, payment..."
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#7c3aed] w-52"
          />
          <div className="relative">
            <Filter className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="pl-7 pr-2 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
            >
              <option value="ALL">All actions</option>
              {actions.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="p-8 text-center text-slate-400 text-sm">No audit entries yet.</div>
      ) : (
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 bg-white z-10">
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <th className="px-5 py-3">When</th>
                <th className="px-5 py-3">Action</th>
                <th className="px-5 py-3">Student</th>
                <th className="px-5 py-3">By</th>
                <th className="px-5 py-3">Reason</th>
                <th className="px-5 py-3">Changes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {entries.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50/70 align-top">
                  <td className="px-5 py-3 font-mono text-slate-600 whitespace-nowrap">
                    {new Date(e.performedAt).toLocaleString()}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${ACTION_STYLES[e.action] || 'bg-slate-100 text-slate-600'}`}>
                      {e.action}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-700 whitespace-nowrap">{studentLabel(e)}</td>
                  <td className="px-5 py-3 text-slate-600 whitespace-nowrap">{e.performedBy}</td>
                  <td className="px-5 py-3 text-slate-600 max-w-[280px]">
                    {e.reason || <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-5 py-3">
                    <details className="text-[10px] text-slate-500">
                      <summary className="cursor-pointer select-none text-[#7c3aed] font-semibold">view</summary>
                      <div className="mt-1 grid grid-cols-2 gap-2 max-w-md">
                        <div>
                          <span className="font-semibold text-slate-600">Before</span>
                          <pre className="whitespace-pre-wrap break-all bg-slate-50 rounded p-1.5 mt-0.5">{JSON.stringify(e.before ?? {}, null, 1)}</pre>
                        </div>
                        <div>
                          <span className="font-semibold text-slate-600">After</span>
                          <pre className="whitespace-pre-wrap break-all bg-slate-50 rounded p-1.5 mt-0.5">{JSON.stringify(e.after ?? {}, null, 1)}</pre>
                        </div>
                      </div>
                      {e.paymentId && <p className="mt-1 font-mono">payment: {e.paymentId}</p>}
                    </details>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
