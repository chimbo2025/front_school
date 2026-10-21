import React, { useState } from 'react';
import {
  AlertTriangle, CheckCircle2, XCircle, ScanSearch, UserPlus, RefreshCw,
  ArrowRight, FileText,
} from 'lucide-react';
import { PaymentClaim, StatementRow } from '../types';
import { formatTsh } from '../config/schoolConfig';
import { useApp } from '../context/AppContext';
import { ClaimStatusBadge } from './ClaimForm';

interface ReviewQueueProps {
  className?: string;
}

export const ReviewQueue: React.FC<ReviewQueueProps> = ({ className = '' }) => {
  const {
    claims, statementRows, students, settings,
    approveClaim, rejectClaim, scanNotFound, assignStatementRow,
  } = useApp();

  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<PaymentClaim | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [assigning, setAssigning] = useState<StatementRow | null>(null);
  const [assignStudentId, setAssignStudentId] = useState('');
  const [assignNote, setAssignNote] = useState('');

  const rowForClaim = (claimId: string): StatementRow | undefined =>
    statementRows.find(
      (r) => r.claimId === claimId && (r.status === 'MATCHED' || r.status === 'ASSIGNED')
    );

  const needsReview = claims.filter((c) => c.status === 'NEEDS_REVIEW' || c.status === 'PENDING');
  const notFound = claims.filter((c) => c.status === 'NOT_FOUND');
  const unclaimedRows = statementRows.filter((r) => r.status === 'UNCLAIMED' && r.direction === 'IN');

  const studentName = (id?: string | null) => {
    if (!id) return '—';
    const s = students.find((st) => st.id === id);
    return s ? `${s.firstName} ${s.lastName}` : id;
  };

  const handleApprove = async (claim: PaymentClaim) => {
    setBusyId(claim.id);
    setError(null);
    try {
      await approveClaim(claim.id, { reviewedBy: 'accountant' });
      setNotice(`Claim ${claim.transactionId || claim.id} approved and allocated.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Approval failed');
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async () => {
    if (!rejecting) return;
    if (!rejectReason.trim()) {
      setError('A rejection reason is required. / Sababu ya kukataa inahitajika.');
      return;
    }
    setBusyId(rejecting.id);
    setError(null);
    try {
      await rejectClaim(rejecting.id, rejectReason.trim(), 'accountant');
      setNotice(`Claim ${rejecting.transactionId || rejecting.id} rejected.`);
      setRejecting(null);
      setRejectReason('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Rejection failed');
    } finally {
      setBusyId(null);
    }
  };

  const handleScan = async () => {
    setBusyId('scan');
    setError(null);
    try {
      const res = await scanNotFound('accountant');
      setNotice(
        `Scan complete: ${res.not_found.length} claim(s) marked NOT_FOUND, ${res.restored.length} restored. / Imekamilika.`
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Scan failed');
    } finally {
      setBusyId(null);
    }
  };

  const handleAssign = async () => {
    if (!assigning) return;
    if (!assignStudentId) {
      setError('Select a student for this payment. / Chagua mwanafunzi.');
      return;
    }
    setBusyId(assigning.id);
    setError(null);
    try {
      const payment = await assignStatementRow(assigning.id, assignStudentId, assignNote.trim() || undefined, 'accountant');
      setNotice(`Payment of ${formatTsh(payment.amount)} assigned to ${studentName(assignStudentId)}.`);
      setAssigning(null);
      setAssignStudentId('');
      setAssignNote('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Assignment failed');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {notice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-sm flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            {notice}
          </span>
          <button onClick={() => setNotice(null)} className="text-xs underline shrink-0">dismiss</button>
        </div>
      )}

      {/* ============ NEEDS REVIEW CLAIMS ============ */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 bg-amber-50/60 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Claims awaiting review ({needsReview.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              A claim can only be approved when its money appears on the till statement. /
              Malipo yanakubaliwa tu yanapoonekana kwenye taarifa ya Lipa Namba.
            </p>
          </div>
        </div>

        {needsReview.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-700">Queue is clear</p>
            <p className="text-xs text-slate-400">All submitted claims have been processed.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {needsReview.map((claim) => {
              const row = rowForClaim(claim.id);
              const canApprove = Boolean(row);
              return (
                <div key={claim.id} className="px-5 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-semibold text-slate-900">{formatTsh(claim.amount)}</span>
                        <span className="font-mono text-[#7c3aed]">{claim.transactionId || '(no txn ID)'}</span>
                        <ClaimStatusBadge status={claim.status} compact />
                      </div>
                      <p className="text-xs text-slate-600">
                        {studentName(claim.studentId)}
                        {claim.gradeName ? ` · ${claim.gradeName}` : ''} · payer {claim.payerPhone} · paid on {claim.paymentDate}
                      </p>
                      {claim.matchReason && (
                        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1 inline-block">
                          {claim.matchReason}
                        </p>
                      )}
                      {row && (
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          Statement row: {formatTsh(row.amount)} from {row.senderPhone || '(no phone)'} on {row.date}
                          {row.matchType ? ` · ${row.matchType}` : ''}
                        </p>
                      )}
                      {!canApprove && (
                        <p className="text-xs text-red-600 flex items-center gap-1">
                          <XCircle className="w-3 h-3" />
                          No statement row yet — import the till statement or assign a row first.
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => { setRejecting(claim); setRejectReason(''); }}
                        disabled={busyId === claim.id}
                        className="px-3 py-1.5 text-xs font-semibold text-red-700 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleApprove(claim)}
                        disabled={!canApprove || busyId === claim.id}
                        title={canApprove ? 'Approve and allocate' : 'Cannot approve without a statement row'}
                        className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {busyId === claim.id ? 'Approving...' : 'Approve'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] text-slate-500">
            Claims older than {settings.notFoundDays} days without a statement row are marked NOT_FOUND automatically.
          </p>
          <button
            onClick={handleScan}
            disabled={busyId === 'scan'}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 border border-slate-300 rounded-lg hover:bg-white disabled:opacity-50 flex items-center gap-1.5"
          >
            <ScanSearch className="w-3.5 h-3.5" />
            {busyId === 'scan' ? 'Scanning...' : 'Scan for NOT FOUND'}
          </button>
        </div>
      </section>

      {/* ============ UNCLAIMED STATEMENT ROWS ============ */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 bg-blue-50/60">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ArrowRight className="w-4 h-4 text-blue-600" />
            Unclaimed statement money ({unclaimedRows.length})
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Incoming payments on the till statement with no matching claim. Assign them to a student. /
            Malipo yasiyo na dai — yapelekwa kwa mwanafunzi.
          </p>
        </div>

        {unclaimedRows.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">No unclaimed rows.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Txn ID</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Sender</th>
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {unclaimedRows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-3 font-mono text-slate-700 whitespace-nowrap">{row.date}</td>
                    <td className="px-5 py-3 font-mono text-[#7c3aed]">{row.transactionId}</td>
                    <td className="px-5 py-3 font-mono font-semibold text-slate-900">{formatTsh(row.amount)}</td>
                    <td className="px-5 py-3 font-mono text-slate-600">{row.senderPhone || '—'}</td>
                    <td className="px-5 py-3 text-slate-600">{row.senderName || '—'}</td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => { setAssigning(row); setAssignStudentId(''); setAssignNote(''); }}
                        className="px-3 py-1.5 text-xs font-semibold text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-50 flex items-center gap-1 ml-auto"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        Assign
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ============ NOT FOUND CLAIMS ============ */}
      {notFound.length > 0 && (
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 bg-slate-50">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-slate-500" />
              Claims marked NOT FOUND ({notFound.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              No statement row appeared within {settings.notFoundDays} days. If the money later shows up,
              the claim returns to the review queue automatically after a scan.
            </p>
          </div>
          <div className="divide-y divide-slate-100">
            {notFound.map((claim) => (
              <div key={claim.id} className="px-5 py-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div>
                  <span className="font-mono font-semibold text-slate-900">{formatTsh(claim.amount)}</span>
                  <span className="ml-2 font-mono text-slate-500">{claim.transactionId || '(no txn ID)'}</span>
                  <span className="ml-2 text-slate-600">{studentName(claim.studentId)}</span>
                  {claim.matchReason && <span className="ml-2 text-slate-400">— {claim.matchReason}</span>}
                </div>
                <ClaimStatusBadge status={claim.status} compact />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ============ REJECT MODAL ============ */}
      {rejecting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-xl shadow-2xl border border-slate-200 p-5 space-y-4">
            <div>
              <h4 className="text-base font-bold text-slate-900">Reject Claim</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                {formatTsh(rejecting.amount)} · {rejecting.transactionId || '(no txn ID)'} · {studentName(rejecting.studentId)}
              </p>
            </div>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              placeholder="Reason (required). E.g. Amount does not match statement / Samalisha kiasi hakilingani..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setRejecting(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={busyId === rejecting.id}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 disabled:opacity-50"
              >
                {busyId === rejecting.id ? 'Rejecting...' : 'Reject Claim'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============ ASSIGN MODAL ============ */}
      {assigning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-xl shadow-2xl border border-slate-200 p-5 space-y-4">
            <div>
              <h4 className="text-base font-bold text-slate-900">Assign Statement Row</h4>
              <p className="text-xs text-slate-500 mt-0.5 font-mono">
                {assigning.transactionId} · {formatTsh(assigning.amount)} · {assigning.date} · {assigning.senderPhone || 'no phone'}
              </p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Student / Mwanafunzi <span className="text-red-500">*</span>
              </label>
              <select
                value={assignStudentId}
                onChange={(e) => setAssignStudentId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
              >
                <option value="">— select student —</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.firstName} {s.lastName} ({s.applicationNo})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Note (optional)</label>
              <input
                type="text"
                value={assignNote}
                onChange={(e) => setAssignNote(e.target.value)}
                placeholder="e.g. Parent confirmed via phone"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setAssigning(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAssign}
                disabled={busyId === assigning.id}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
              >
                <UserPlus className="w-3.5 h-3.5" />
                {busyId === assigning.id ? 'Assigning...' : 'Assign Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
