import React, { useState } from 'react';
import { X, FileText, CreditCard, AlertCircle, CheckCircle2, Eye, User } from 'lucide-react';
import { Student, PaymentClaim, PaymentMethod, ClaimStatus } from '../types';
import { formatTsh } from '../config/schoolConfig';
import { isValidPhone, claimStatusLabel, claimStatusSwahili } from '../lib/matching';

export interface ClaimSubmitData {
  studentId: string;
  amount: number;
  transactionId: string;
  paymentDate: string;
  payerPhone: string;
  method?: PaymentMethod;
  screenshot?: string;
  notes?: string;
}

interface ClaimFormProps {
  isOpen: boolean;
  onClose: () => void;
  /** All students a claim can be filed for. When exactly one is passed, the student picker is hidden. */
  students: Student[];
  onSubmit: (data: ClaimSubmitData) => Promise<void>;
}

export const ClaimForm: React.FC<ClaimFormProps> = ({
  isOpen,
  onClose,
  students,
  onSubmit,
}) => {
  const [studentId, setStudentId] = useState<string>(students[0]?.id || '');
  const [amount, setAmount] = useState<number>(0);
  const [transactionId, setTransactionId] = useState<string>('');
  const [method, setMethod] = useState<PaymentMethod>('M-Pesa');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [payerPhone, setPayerPhone] = useState<string>(students[0]?.parentPhone || '');
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const selected = students.find((s) => s.id === studentId) || students[0];

  const paymentMethods: { id: PaymentMethod; name: string; icon: string }[] = [
    { id: 'M-Pesa', name: 'Vodacom M-Pesa', icon: '🔴' },
    { id: 'Mixx by Yas', name: 'Mixx by Yas (Zantel)', icon: '📱' },
    { id: 'Airtel Money', name: 'Airtel Money', icon: '⚪' },
    { id: 'Bank', name: 'Bank Transfer', icon: '🏦' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!studentId) {
      setError('Please select a student. / Tafadhali chagua mwanafunzi.');
      return;
    }
    if (amount <= 0) {
      setError('Please enter an amount greater than 0. / Weka kiasi sahihi.');
      return;
    }
    if (!transactionId.trim()) {
      setError('Transaction ID is required. / Namba ya muamala inahitajika.');
      return;
    }
    if (!isValidPhone(payerPhone)) {
      setError('Enter a valid phone number (e.g. 0777123456 or +255777123456). / Namba ya simu si sahihi.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        studentId,
        amount,
        transactionId: transactionId.trim().toUpperCase(),
        paymentDate: date,
        payerPhone: payerPhone.trim(),
        method,
        screenshot: screenshot || undefined,
        notes: notes.trim() || undefined,
      });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit claim');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Screenshot must be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => setScreenshot(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  if (!isOpen) return null;

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs">
        <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden border border-slate-200">
          <div className="p-6 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Claim Submitted Successfully</h3>
            <p className="text-sm text-slate-600">
              Your payment claim for <span className="font-semibold">{formatTsh(amount)}</span> has been submitted for review.
            </p>
            <div className="p-3 bg-slate-50 rounded-lg text-left text-xs space-y-1">
              <p><span className="font-semibold">Transaction ID:</span> {transactionId}</p>
              <p><span className="font-semibold">Method:</span> {method}</p>
              <p><span className="font-semibold">Date:</span> {date}</p>
              <p><span className="font-semibold">Payer phone:</span> {payerPhone}</p>
            </div>
            <p className="text-xs text-slate-500">
              The finance team will verify your claim against the Lipa Namba statement.
              The money only counts as paid once it appears on the statement.
            </p>
            <button
              onClick={() => { setSuccess(false); onClose(); }}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden border border-slate-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50">
          <div>
            <h3 className="text-base font-bold text-slate-900">Submit Payment Claim</h3>
            <p className="text-xs text-slate-500">Wasilisha malipo ya Lipa Namba</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {students.length > 1 && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Student / Mwanafunzi <span className="text-red-500">*</span>
              </label>
              <select
                value={studentId}
                onChange={(e) => {
                  const next = students.find((s) => s.id === e.target.value);
                  setStudentId(e.target.value);
                  if (next) setPayerPhone(next.parentPhone);
                }}
                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.firstName} {s.lastName} ({s.applicationNo})
                  </option>
                ))}
              </select>
            </div>
          )}
          {selected && (
            <p className="text-[11px] text-slate-500 -mt-2 flex items-center gap-1">
              <User className="w-3 h-3" />
              For {selected.firstName} {selected.lastName} ({selected.applicationNo})
            </p>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Payment Amount (TZS) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                value={amount || ''}
                onChange={(e) => setAmount(Number(e.target.value) || 0)}
                min={1000}
                step={1000}
                className="w-full pl-4 pr-16 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-base font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#7c3aed] font-mono"
                required
              />
              <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-500">Tsh</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Transaction ID / Namba ya Muamala <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value.toUpperCase())}
              placeholder="e.g. MP260110091"
              className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
              required
              maxLength={20}
            />
            <p className="text-[11px] text-slate-500 mt-1">Found on your M-Pesa/Mixx/Airtel confirmation SMS</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Payment Date / Tarehe ya Malipo <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed] font-mono"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Payer Phone / Simu ya Mlipaji <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={payerPhone}
              onChange={(e) => setPayerPhone(e.target.value)}
              placeholder="0777123456"
              className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
              required
            />
            <p className="text-[11px] text-slate-500 mt-1">
              The number the money was sent from. Must match your saved phone number.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Payment Channel <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {paymentMethods.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMethod(m.id)}
                  className={`flex items-center gap-2 p-2.5 rounded-lg border text-left transition-all ${
                    method === m.id
                      ? 'border-2 border-[#7c3aed] bg-purple-50/50'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <span className="text-base">{m.icon}</span>
                  <span className="text-xs font-semibold text-slate-900">{m.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Screenshot (Optional)
            </label>
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleScreenshotChange}
                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed] cursor-pointer"
              />
              {screenshot && (
                <div className="mt-2 p-2 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                  <span className="text-xs text-slate-600 flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" />
                    Screenshot attached
                  </span>
                  <button
                    type="button"
                    onClick={() => setScreenshot(null)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Max 5MB. JPG, PNG supported.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Any additional details about this payment..."
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed] resize-none"
            />
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              A claim is only verified once the payment appears on the school's Lipa Namba statement.
              Duplicate or fraudulent claims will be rejected.
            </span>
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-2.5 px-4 border border-slate-300 bg-white text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 px-4 bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-lg text-xs font-semibold shadow-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {isSubmitting ? 'Submitting...' : <>Submit Claim <CreditCard className="w-3.5 h-3.5" /></>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const STATUS_STYLES: Record<ClaimStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-700 border-amber-200',
  NEEDS_REVIEW: 'bg-orange-100 text-orange-700 border-orange-200',
  APPROVED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  REJECTED: 'bg-red-100 text-red-700 border-red-200',
  NOT_FOUND: 'bg-slate-100 text-slate-600 border-slate-300',
};

export const ClaimStatusBadge: React.FC<{ status: ClaimStatus; compact?: boolean }> = ({ status, compact }) => (
  <span
    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${STATUS_STYLES[status]}`}
    title={claimStatusSwahili(status)}
  >
    {claimStatusLabel(status)}
    {!compact && status === 'NEEDS_REVIEW' && (
      <span className="ml-1 font-normal opacity-75">({claimStatusSwahili(status)})</span>
    )}
  </span>
);

interface ClaimListProps {
  claims: PaymentClaim[];
  onViewClaim: (claim: PaymentClaim) => void;
}

export const ClaimList: React.FC<ClaimListProps> = ({ claims, onViewClaim }) => {
  if (claims.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 space-y-2">
        <FileText className="w-8 h-8 text-slate-300 mx-auto" />
        <p className="text-sm font-medium text-slate-700">No Payment Claims Yet</p>
        <p className="text-xs text-slate-400">Parent-submitted claims will appear here.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
            <th className="px-4 py-3">Submitted</th>
            <th className="px-4 py-3">Student</th>
            <th className="px-4 py-3">Amount</th>
            <th className="px-4 py-3">Txn ID</th>
            <th className="px-4 py-3">Paid On</th>
            <th className="px-4 py-3">Payer</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {claims.map((claim) => (
            <tr key={claim.id} className="hover:bg-slate-50/70 transition-colors">
              <td className="px-4 py-3 font-mono text-slate-700 whitespace-nowrap">
                {new Date(claim.submittedAt).toLocaleDateString()}
              </td>
              <td className="px-4 py-3 font-medium text-slate-900">
                {claim.studentName || claim.studentId}
                {claim.gradeName && <span className="block text-[10px] text-slate-400">{claim.gradeName}</span>}
              </td>
              <td className="px-4 py-3 font-mono font-semibold text-slate-900">
                {formatTsh(claim.amount)}
              </td>
              <td className="px-4 py-3 font-mono text-purple-700 whitespace-nowrap">
                {claim.transactionId || <span className="text-slate-400">—</span>}
              </td>
              <td className="px-4 py-3 font-mono text-slate-600 whitespace-nowrap">
                {claim.paymentDate}
              </td>
              <td className="px-4 py-3 font-mono text-slate-600 whitespace-nowrap">
                {claim.payerPhone}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <ClaimStatusBadge status={claim.status} />
              </td>
              <td className="px-4 py-3 text-right whitespace-nowrap">
                <button
                  onClick={() => onViewClaim(claim)}
                  className="px-2.5 py-1 text-xs font-semibold text-purple-700 hover:bg-purple-50 rounded-lg transition-colors flex items-center justify-end gap-1 ml-auto"
                  title="View Claim"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">View</span>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
