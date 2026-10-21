import React from 'react';
import { Student, Payment, Allocation, FeeLine } from '../types';
import { formatTsh } from '../config/schoolConfig';
import { schoolConfig } from '../config/schoolConfig';

interface ReceiptProps {
  student: Student;
  payment: Payment;
  gradeName?: string;
  feeLines: Array<{
    feeLine: FeeLine;
    paid: number;
    due: number;
    status: 'UNPAID' | 'PARTIAL' | 'PAID';
    allocations: Allocation[];
  }>;
  account: {
    totalFees: number;
    totalPaid: number;
    balance: number;
    credit: number;
  };
  onPrint?: () => void;
}

export const Receipt: React.FC<ReceiptProps> = ({
  student,
  payment,
  gradeName,
  feeLines,
  account,
  onPrint,
}) => {
  const paymentAllocations = feeLines.flatMap((fl) =>
    fl.allocations.filter((a) => a.paymentId === payment.id)
  );

  const paymentBreakdown = feeLines
    .map((fl) => {
      const allocForPayment = fl.allocations.find((a) => a.paymentId === payment.id);
      if (!allocForPayment) return null;
      return {
        feeGroup: fl.feeLine.feeGroupName,
        feeItem: fl.feeLine.feeItemLabel,
        amount: allocForPayment.amount,
        status: fl.status,
      };
    })
    .filter((b): b is typeof b & { feeGroup: string; feeItem: string; amount: number; status: string } => b !== null);

  const handlePrint = () => {
    if (onPrint) onPrint();
    else window.print();
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 print:p-0 print:border-0 print:shadow-none">
      <div className="mb-5 flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-3">
          <img
            src="/logo.jpeg"
            alt={`${schoolConfig.shortName} Logo`}
            className="w-10 h-10 rounded-lg object-cover print:hidden"
          />
          <div>
            <h3 className="text-lg font-bold text-slate-900">Payment Receipt</h3>
            <p className="text-xs text-slate-500">{schoolConfig.name} · {schoolConfig.location}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500">Receipt Date</p>
          <p className="font-mono text-sm text-slate-900">{payment.date}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider">Student</p>
          <p className="font-semibold text-slate-900">{student.firstName} {student.middleName ? `${student.middleName} ` : ''}{student.lastName}</p>
          <p className="text-xs text-slate-500 font-mono">{student.applicationNo}</p>
          <p className="text-xs text-slate-500 mt-1">Grade: <span className="font-semibold text-slate-700">{gradeName || '—'}</span></p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500 uppercase tracking-wider">Transaction Ref</p>
          <p className="font-mono font-semibold text-purple-700">{payment.reference}</p>
          <p className="text-xs text-slate-500 capitalize">{payment.method}</p>
        </div>
      </div>

      <div className="border-t border-slate-200 my-4" />

      <div className="mb-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Payment Allocation</h4>
        <div className="space-y-1">
          {paymentBreakdown.map((item, idx) => (
            <div key={idx} className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-slate-800">{item.feeItem}</span>
                <span className="text-xs text-slate-500">{item.feeGroup}</span>
              </div>
              <span className="font-mono font-semibold text-slate-900">{formatTsh(item.amount)}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between items-center pt-2 border-t border-slate-200 font-bold">
          <span className="text-slate-900">Total Paid</span>
          <span className="font-mono text-emerald-700">{formatTsh(payment.amount)}</span>
        </div>
      </div>

      <div className="border-t border-slate-200 my-4" />

      <div className="mb-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Account Summary After This Payment</h4>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="text-xs text-slate-500">Total Fees</p>
            <p className="font-mono font-bold text-slate-900">{formatTsh(account.totalFees)}</p>
          </div>
          <div className="p-3 bg-emerald-50 rounded-lg">
            <p className="text-xs text-emerald-700">Total Paid</p>
            <p className="font-mono font-bold text-emerald-700">{formatTsh(account.totalPaid)}</p>
          </div>
          <div className={`p-3 rounded-lg ${account.balance > 0 ? 'bg-amber-50' : 'bg-emerald-50'}`}>
            <p className={`text-xs ${account.balance > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
              {account.balance > 0 ? 'Balance Due' : 'Credit Balance'}
            </p>
            <p className={`font-mono font-bold ${account.balance > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
              {formatTsh(account.balance > 0 ? account.balance : account.credit)}
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200 pt-4 print:border-t">
        <div className="flex items-center justify-between">
          <div className="text-xs text-slate-500 flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Generated: {new Date().toLocaleString()}</span>
          </div>
          <button
            onClick={handlePrint}
            className="px-3 py-1.5 text-xs font-semibold text-purple-700 hover:text-purple-900 underline print:hidden"
          >
            Print Receipt
          </button>
        </div>
      </div>
    </div>
  );
};

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  payment: Payment;
  gradeName?: string;
  feeLines: Array<{
    feeLine: FeeLine;
    paid: number;
    due: number;
    status: 'UNPAID' | 'PARTIAL' | 'PAID';
    allocations: Allocation[];
  }>;
  account: {
    totalFees: number;
    totalPaid: number;
    balance: number;
    credit: number;
  };
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  student,
  payment,
  gradeName,
  feeLines,
  account,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden border border-slate-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50 print:hidden">
          <h3 className="text-base font-bold text-slate-900">Payment Receipt</h3>
          <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-slate-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-5">
          <Receipt student={student} payment={payment} gradeName={gradeName} feeLines={feeLines} account={account} />
        </div>
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex justify-end print:hidden">
          <button onClick={onClose} className="px-4 py-2 bg-slate-800 text-white rounded-lg font-medium text-sm">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};