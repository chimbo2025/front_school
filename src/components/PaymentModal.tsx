import React, { useState } from 'react';
import { X, CheckCircle2, Smartphone, Building, ShieldCheck, ArrowRight } from 'lucide-react';
import { PaymentMethod, Student } from '../types';
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
  const [method, setMethod] = useState<PaymentMethod>('Mixx by Yas');
  const [phoneNumber, setPhoneNumber] = useState(student.parentPhone || '0778407818');
  const [bankReference, setBankReference] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const paymentMethods: { id: PaymentMethod; name: string; subtitle: string; icon: string; color: string }[] = [
    {
      id: 'Mixx by Yas',
      name: 'Mixx by Yas',
      subtitle: 'Zantel mobile money (Zanzibar)',
      icon: '📱',
      color: 'border-emerald-500 bg-emerald-50/50',
    },
    {
      id: 'M-Pesa',
      name: 'Vodacom M-Pesa',
      subtitle: 'M-Pesa',
      icon: '🔴',
      color: 'border-red-500 bg-red-50/50',
    },
    {
      id: 'Airtel Money',
      name: 'Airtel Money',
      subtitle: 'Airtel Pay / USSD',
      icon: '⚪',
      color: 'border-amber-500 bg-amber-50/50',
    },
    {
      id: 'Bank',
      name: 'Bank Transfer',
      subtitle: 'PBZ / CRDB / NMB Bank',
      icon: '🏦',
      color: 'border-blue-500 bg-blue-50/50',
    },
  ];

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) return;

    setIsProcessing(true);
    setTimeout(() => {
      const generatedRef = method === 'Bank'
        ? (bankReference || `BNK-${Math.floor(100000 + Math.random() * 900000)}`)
        : `${method.substring(0, 2).toUpperCase()}${Date.now().toString().slice(-6)}`;

      addPayment({
        studentId: student.id,
        amount,
        method,
        date: new Date().toISOString().split('T')[0],
        reference: generatedRef,
        notes: isAdmissionFeeOnly ? 'Online Admission Fee Payment' : 'School Fee Installment',
      });

      setIsProcessing(false);
      setIsSuccess(true);
      if (onSuccess) {
        onSuccess();
      }
    }, 900);
  };

  const handleClose = () => {
    setIsSuccess(false);
    setIsProcessing(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50">
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
          <div className="p-6 text-center space-y-4">
            <div className="w-14 h-14 bg-emerald-100 text-[#16a34a] rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-slate-900">Payment Successful!</h4>
              <p className="text-sm text-slate-600 mt-1">
                We received <span className="font-semibold text-emerald-700">{formatTsh(amount)}</span> for {student.firstName}.
              </p>
              <div className="mt-3 inline-block bg-slate-100 text-slate-800 text-xs px-3 py-1.5 rounded font-mono">
                Receipt Reference: {method === 'Bank' ? (bankReference || 'PBZ-TRANS-OK') : `${method.slice(0, 2).toUpperCase()}-9481`}
              </div>
            </div>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              A confirmation SMS has been prepared for {student.parentPhone}. The admission office has updated your student profile.
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
          <form onSubmit={handlePay} className="p-5 space-y-4">
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

            {/* Select Method */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Select Payment Channel
              </label>
              <div className="grid grid-cols-2 gap-2">
                {paymentMethods.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMethod(m.id)}
                    className={`flex items-start gap-2 p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                      method === m.id
                        ? `${m.color} border-2 shadow-xs`
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <span className="text-base">{m.icon}</span>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-900 truncate">{m.name}</div>
                      <div className="text-[10px] text-slate-500 truncate">{m.subtitle}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Method specific inputs */}
            {method !== 'Bank' ? (
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Mobile Money Number
                </label>
                <div className="flex gap-2">
                  <span className="inline-flex items-center px-2.5 py-2 rounded-lg border border-slate-300 bg-slate-100 text-xs font-medium text-slate-600">
                    +255
                  </span>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="0778407818"
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  A USSD push notification will simulate payment prompt on your phone.
                </p>
              </div>
            ) : (
              <div className="space-y-2 bg-blue-50/60 p-3 rounded-lg border border-blue-100 text-xs">
                <div className="font-semibold text-blue-900">Bright Future School Bank Accounts:</div>
                <div className="text-blue-800 space-y-0.5">
                  <p>• People's Bank of Zanzibar (PBZ): <span className="font-mono font-semibold">0210084920</span></p>
                  <p>• CRDB Bank Zanzibar Branch: <span className="font-mono font-semibold">015029384910</span></p>
                </div>
                <div className="pt-1">
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">
                    Bank Deposit Slip / Reference Number
                  </label>
                  <input
                    type="text"
                    value={bankReference}
                    onChange={(e) => setBankReference(e.target.value)}
                    placeholder="e.g. PBZ-884920 or Counter Slip No."
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs focus:ring-2 focus:ring-[#7c3aed]"
                  />
                </div>
              </div>
            )}

            {/* Consent note */}
            <div className="flex items-center gap-2 text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Mock simulation mode. No actual money is deducted. Updates student state in real time.
              </span>
            </div>

            {/* Submit */}
            <div className="pt-1">
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-3 px-4 bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-semibold rounded-lg text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <span>Processing Payment Simulation...</span>
                ) : (
                  <>
                    <span>Confirm & Pay {formatTsh(amount)}</span>
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
