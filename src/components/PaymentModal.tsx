import React, { useState } from 'react';
import { X, CheckCircle2, ShieldCheck, ArrowRight, Copy, Check } from 'lucide-react';
import { Student } from '../types';
import { formatTsh, schoolConfig } from '../config/schoolConfig';
import { useApp } from '../context/AppContext';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  defaultAmount?: number;
  title?: string;
  isAdmissionFeeOnly?: boolean;
  onSuccess?: () => void;
}

const PAYMENT_STEPS = [
  'Open M-Pesa, Airtel Money or Mixx by Yas on your phone.',
  'Choose "Lipa Namba" (Lipa kwa Namba).',
  'Enter the account number above and the amount to pay.',
  'Confirm — you will receive an SMS with a Transaction ID.',
];

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  student,
  defaultAmount,
  title = "Pay Admission Fee",
  isAdmissionFeeOnly = false,
  onSuccess,
}) => {
  const { addPayment, getGradeById } = useApp();
  const grade = getGradeById(student.gradeId);

  // Default admission fee amount if not specified
  const admissionFeeItem = grade?.feeGroups
    .find((fg) => fg.name.toUpperCase().includes('ADMISSION'))
    ?.items[0]?.amount || 150000;

  const initialAmount = defaultAmount !== undefined ? defaultAmount : (isAdmissionFeeOnly ? admissionFeeItem : 150000);

  const [amount, setAmount] = useState<number>(initialAmount);
  const [txnId, setTxnId] = useState('');
  const [note, setNote] = useState('');
  const [copied, setCopied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [paidReference, setPaidReference] = useState('');

  if (!isOpen) return null;

  const reference = txnId.trim().toUpperCase();
  const canSubmit = amount > 0 && reference.length > 0 && !isProcessing;

  const copyLipa = async () => {
    try {
      await navigator.clipboard.writeText(schoolConfig.lipaNamba);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable — the number is visible for manual copying.
    }
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setIsProcessing(true);
    try {
      await addPayment({
        studentId: student.id,
        amount,
        method: 'Lipa Namba',
        date: new Date().toISOString().split('T')[0],
        reference,
        notes: [
          isAdmissionFeeOnly ? 'Online Admission Fee Payment' : 'School Fee Installment',
          note.trim(),
        ].filter(Boolean).join(' — '),
      });

      setPaidReference(reference);
      setIsProcessing(false);
      setIsSuccess(true);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setIsProcessing(false);
      alert(err instanceof Error ? err.message : 'Payment failed');
    }
  };

  const handleClose = () => {
    setIsSuccess(false);
    setIsProcessing(false);
    setTxnId('');
    setNote('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-lg max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2rem)] rounded-xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50">
          <div>
            <h3 className="text-base font-bold text-slate-900">{title}</h3>
            <p className="text-xs text-slate-500">
              For {student.firstName} {student.lastName} ({student.applicationNo})
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {isSuccess ? (
          <div className="flex-1 min-h-0 overflow-y-auto p-6 text-center space-y-4">
            <div className="w-14 h-14 bg-emerald-100 text-[#16a34a] rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-slate-900">Payment Recorded!</h4>
              <p className="text-sm text-slate-600 mt-1">
                Received <span className="font-semibold text-emerald-700">{formatTsh(amount)}</span> for {student.firstName}.
              </p>
              <div className="mt-3 inline-block bg-slate-100 text-slate-800 text-xs px-3 py-1.5 rounded font-mono">
                Transaction ID: {paidReference}
              </div>
            </div>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              The payment has been added to {student.firstName}'s fee balance and allocated to the
              outstanding fee items.
            </p>
            <div className="pt-2">
              <button
                onClick={handleClose}
                className="w-full py-2.5 px-4 bg-[#16a34a] hover:bg-emerald-700 text-white font-medium rounded-lg text-sm transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handlePay} className="flex-1 min-h-0 overflow-y-auto p-5 space-y-4">
            {/* Amount input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Payment Amount (TZS)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  min={10000}
                  step={5000}
                  required
                  className="w-full pl-4 pr-16 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-base font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#7c3aed] focus:border-transparent font-mono"
                />
                <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-500">
                  {schoolConfig.currency}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Standard Admission Fee is 150,000 Tsh. You can pay partial or full.
              </p>
            </div>

            {/* Lipa Namba instructions */}
            <div className="rounded-xl border border-emerald-200 overflow-hidden shadow-xs">
              <div className="bg-gradient-to-br from-emerald-50 to-white px-4 py-3.5">
                <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">
                  Lipa Namba / Account Number
                </p>
                <div className="flex items-center justify-between gap-3 mt-1">
                  <span className="font-mono text-xl sm:text-2xl font-extrabold text-slate-900 tracking-[0.2em]">
                    {schoolConfig.lipaNamba}
                  </span>
                  <button
                    type="button"
                    onClick={copyLipa}
                    className="shrink-0 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
              </div>
              <ol className="px-4 py-3 bg-white border-t border-slate-100 space-y-1.5">
                {PAYMENT_STEPS.map((step, i) => (
                  <li key={i} className="flex items-start gap-2 text-[11px] text-slate-600">
                    <span className="mt-px w-4 h-4 shrink-0 rounded-full bg-emerald-100 text-emerald-700 text-[9px] font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Transaction ID */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Transaction ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={txnId}
                onChange={(e) => setTxnId(e.target.value)}
                placeholder="e.g. SI84K2LM9X"
                required
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono font-semibold uppercase text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#7c3aed] focus:border-transparent"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                From the confirmation SMS — this becomes the official receipt reference.
              </p>
            </div>

            {/* Optional note */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Note (optional)
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Term 1 tuition installment"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
              />
            </div>

            {/* Consent note */}
            <div className="flex items-center gap-2 text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Payment is recorded instantly in this demo. In production, Lipa Namba payments are
                reconciled against the school account statement.
              </span>
            </div>

            {/* Submit */}
            <div className="pt-1">
              <button
                type="submit"
                disabled={!canSubmit}
                className="w-full py-3 px-4 bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-semibold rounded-lg text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <span>Recording Payment...</span>
                ) : (
                  <>
                    <span>Confirm Payment {formatTsh(amount)}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
