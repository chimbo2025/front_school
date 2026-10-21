import React, { useState } from 'react';
import { X, AlertCircle, ArrowRight } from 'lucide-react';
import { Student, Payment, Allocation, FeeLine, Grade } from '../types';
import { formatTsh } from '../config/schoolConfig';
import { useApp } from '../context/AppContext';

interface ReallocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  payment: Payment;
  grade: Grade;
  feeLines: FeeLine[];
  currentAllocations: Allocation[];
  onSuccess: () => void;
}

export const ReallocationModal: React.FC<ReallocationModalProps> = ({
  isOpen,
  onClose,
  student,
  payment,
  grade,
  feeLines,
  currentAllocations,
  onSuccess,
}) => {
  const { reallocatePayment } = useApp();
  const [targetFeeLineId, setTargetFeeLineId] = useState<string>('');
  const [amount, setAmount] = useState<number>(0);
  const [reason, setReason] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const paymentAllocs = currentAllocations.filter((a) => a.paymentId === payment.id && !a.reversed);
  const totalAllocatable = paymentAllocs.reduce((sum, a) => sum + a.amount, 0);

  const availableLines = feeLines.map((line) => {
    const otherAllocs = currentAllocations.filter(
      (a) => a.feeLineId === line.id && a.paymentId !== payment.id && !a.reversed
    );
    const paidByOthers = otherAllocs.reduce((sum, a) => sum + a.amount, 0);
    const due = line.amount - paidByOthers;
    const currentOnLine = paymentAllocs.find((a) => a.feeLineId === line.id)?.amount || 0;
    return { ...line, due, currentOnLine };
  });

  const handleReallocate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetFeeLineId) {
      setError('Please select a fee line to reallocate to');
      return;
    }
    if (amount <= 0) {
      setError('Please enter an amount greater than 0');
      return;
    }
    if (amount > totalAllocatable) {
      setError(`Cannot reallocate more than ${formatTsh(totalAllocatable)} from this payment`);
      return;
    }
    if (!reason.trim()) {
      setError('Please provide a reason for reallocation');
      return;
    }

    const targetLine = availableLines.find((l) => l.id === targetFeeLineId);
    if (targetLine && amount > targetLine.due) {
      setError(`Cannot allocate more than ${formatTsh(targetLine.due)} to this fee line (remaining due)`);
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      await reallocatePayment({
        paymentId: payment.id,
        studentId: student.id,
        targetFeeLineId,
        amount,
        reason: reason.trim(),
        performedBy: 'accountant',
      });
      onSuccess();
      setIsProcessing(false);
      onClose();
    } catch (err) {
      setIsProcessing(false);
      setError(err instanceof Error ? err.message : 'Reallocation failed');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl overflow-hidden border border-slate-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50">
          <div>
            <h3 className="text-base font-bold text-slate-900">Reallocate Payment</h3>
            <p className="text-xs text-slate-500">
              {student.firstName} {student.lastName} · {formatTsh(payment.amount)} · {payment.reference}
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleReallocate} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Payment Amount (Available: {formatTsh(totalAllocatable)})
            </label>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 font-mono font-semibold text-slate-900">
              {formatTsh(payment.amount)}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Current Allocation
            </label>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {paymentAllocs.length === 0 ? (
                <p className="text-xs text-slate-500">No allocations yet</p>
              ) : (
                paymentAllocs.map((alloc, idx) => {
                  const line = feeLines.find((l) => l.id === alloc.feeLineId);
                  return (
                    <div key={idx} className="flex justify-between text-sm py-1 px-2 bg-slate-50 rounded">
                      <span className="text-slate-600">{line?.feeItemLabel || 'Unknown'}</span>
                      <span className="font-mono font-semibold text-slate-900">{formatTsh(alloc.amount)}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Reallocate To <span className="text-red-500">*</span>
            </label>
            <select
              value={targetFeeLineId}
              onChange={(e) => setTargetFeeLineId(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
              required
            >
              <option value="">Select fee line...</option>
              {availableLines
                .filter((l) => l.due > 0 || l.currentOnLine > 0)
                .map((line) => (
                  <option key={line.id} value={line.id}>
                    {line.feeGroupName} → {line.feeItemLabel} (Due: {formatTsh(line.due)})
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Amount to Reallocate <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value) || 0)}
                min={1}
                step={1000}
                className="w-full pl-4 pr-16 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-base font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#7c3aed] font-mono"
                required
              />
              <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-500">Tsh</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="e.g. Parent requested this payment to cover transport instead of tuition"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed] resize-none"
              required
            />
            <p className="text-[11px] text-slate-500 mt-1">This will be recorded in the audit trail.</p>
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 border border-slate-300 bg-white text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="flex-1 py-2.5 px-4 bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-lg text-xs font-semibold shadow-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {isProcessing ? 'Processing...' : <>Reallocate <ArrowRight className="w-3.5 h-3.5" /></>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};