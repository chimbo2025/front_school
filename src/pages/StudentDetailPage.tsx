import React, { useEffect, useState } from 'react';
import { 
  ArrowLeft, 
  User, 
  Phone, 
  MapPin, 
  Calendar, 
  BookOpen, 
  CreditCard, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  Receipt as ReceiptIcon,
  FileCheck,
  ChevronRight,
  Plus,
  BarChart3,
  Layers,
  Menu,
  Users,
  Eye,
  RotateCcw,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatTsh, schoolConfig } from '../config/schoolConfig';
import { FeeStatement } from '../components/FeeStatement';
import { PaymentModal } from '../components/PaymentModal';
import { ReceiptModal } from '../components/Receipt';
import { ReallocationModal } from '../components/ReallocationModal';
import { AdminSidebar, AdminNavItem, AdminTab } from '../components/AdminSidebar';
import { StudentStatus } from '../types';
import { User as UserType } from '../services/auth';

interface StudentDetailPageProps {
  studentId: string;
  onNavigate: (path: string) => void;
  onOpenFeesModal: () => void;
  user: UserType | null;
  onLogout: () => void;
}

export const StudentDetailPage: React.FC<StudentDetailPageProps> = ({
  studentId,
  onNavigate,
  onOpenFeesModal,
  user,
  onLogout,
}) => {
  const { 
    getStudentById, 
    getGradeById, 
    getStudentPayments, 
    getStudentTotalFees, 
    getStudentPaidAmount, 
    getStudentBalance,
    getStudentCredit,
    getStudentAccount,
    getAllocationBreakdown,
    getStudentComputedStatus,
    updateStudentStatus,
    students,
    grades,
    financeSummary
  } = useApp();

  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [receiptPaymentId, setReceiptPaymentId] = useState<string | null>(null);
  const [reallocationPaymentId, setReallocationPaymentId] = useState<string | null>(null);

  // Mobile drawer: close on Escape and lock background scroll
  // (must run before the early return below — Rules of Hooks)
  useEffect(() => {
    if (!isMobileNavOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMobileNavOpen(false);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isMobileNavOpen]);

  const student = getStudentById(studentId);
  if (!student) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-xl border border-slate-200 text-center max-w-md shadow-sm">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
          <h2 className="text-lg font-bold text-slate-900">Student Record Not Found</h2>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            The student with ID "{studentId}" does not exist in the local records.
          </p>
          <button
            onClick={() => onNavigate('/admin')}
            className="px-4 py-2 bg-[#7c3aed] text-white rounded-lg text-xs font-semibold"
          >
            Return to Admin List
          </button>
        </div>
      </div>
    );
  }

  const grade = getGradeById(student.gradeId);
  const payments = getStudentPayments(student.id);
  const totalFees = getStudentTotalFees(student.id);
  const paidAmount = getStudentPaidAmount(student.id);
  const balance = getStudentBalance(student.id);
  const credit = getStudentCredit(student.id);
  const account = getStudentAccount(student.id);
  const allocationBreakdown = getAllocationBreakdown(student.id);
  const feeLines = allocationBreakdown.map((ab) => ab.feeLine);
  const computedStatus = getStudentComputedStatus(student.id);

  const getStatusConfig = (status: StudentStatus) => {
    switch (status) {
      case 'Admitted':
        return { color: 'bg-purple-50 text-purple-700 border-purple-200', icon: CheckCircle2, iconColor: 'text-purple-600', label: 'Admitted' };
      case 'Paid':
        return { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: FileCheck, iconColor: 'text-emerald-600', label: 'Paid' };
      case 'Partial':
        return { color: 'bg-blue-50 text-blue-700 border-blue-200', icon: CreditCard, iconColor: 'text-blue-600', label: 'Partial' };
      case 'Pending':
      default:
        return { color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock, iconColor: 'text-amber-600', label: 'Pending' };
    }
  };

  const statusConfig = getStatusConfig(computedStatus);
  const storedStatusConfig = getStatusConfig(student.status);

  const navItems: AdminNavItem[] = [
    {
      id: 'students',
      label: 'Students',
      hint: 'Applications & files',
      icon: Users,
      badge: String(students.length),
      badgeClassName: 'bg-slate-700 text-slate-200',
    },
    {
      id: 'finance',
      label: 'Finance',
      hint: 'Collections & receipts',
      icon: BarChart3,
      badge: `${financeSummary.collectionRate}%`,
      badgeClassName: 'bg-emerald-500/15 text-emerald-300',
    },
    {
      id: 'grades',
      label: 'Grades & Fees',
      hint: 'Fee structures',
      icon: Layers,
      badge: String(grades.length),
      badgeClassName: 'bg-slate-700 text-slate-200',
      children: [
        { id: 'grades', label: 'All Grades & Fee Structures' },
        { id: 'register', label: 'Register New Student' },
        { id: 'grades', label: 'Preview Fee Statement', action: 'preview-fees' },
      ],
    },
  ];

  // The sidebar always lands on Students; other tabs hand off to /admin?tab=…
  const handleSelectTab = (tab: AdminTab) => {
    setIsMobileNavOpen(false);
    onNavigate(tab === 'students' ? '/admin' : `/admin?tab=${tab}`);
  };

  const sidebarProps = {
    items: navItems,
    activeTab: 'students' as AdminTab,
    onSelectTab: handleSelectTab,
    onPreviewFees: onOpenFeesModal,
    onBackToSite: () => onNavigate('/'),
    user,
    onLogout,
  };

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* ===== FLUSH-LEFT FULL-HEIGHT SIDEBAR (desktop) ===== */}
      <aside className="hidden lg:block w-64 xl:w-72 shrink-0 h-screen sticky top-0 z-30 border-r border-slate-800 shadow-xl">
        <AdminSidebar {...sidebarProps} />
      </aside>

      {/* ===== MOBILE DRAWER (same sidebar) ===== */}
      {isMobileNavOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setIsMobileNavOpen(false)}
            aria-hidden="true"
          />
          <div className="relative h-full w-72 max-w-[85vw] shadow-2xl">
            <AdminSidebar {...sidebarProps} onClose={() => setIsMobileNavOpen(false)} />
          </div>
        </div>
      )}

      {/* ===== RIGHT COLUMN: banner + content ===== */}
      <div className="flex-1 min-w-0 flex flex-col pb-16">
      {/* Top Banner Navigation */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-4 shadow-2xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => setIsMobileNavOpen(true)}
              className="lg:hidden rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 shrink-0"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <button
              onClick={() => onNavigate('/admin')}
              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center gap-1.5 text-xs font-semibold transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Students List</span>
              <span className="sm:hidden">Back</span>
            </button>
            <span className="text-slate-300 hidden sm:inline">|</span>
            <span className="text-xs text-slate-500 hidden sm:inline truncate">
              Student Profile · {student.applicationNo}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Smart Status Display */}
            <div className="relative">
              <select
                value={computedStatus}
                onChange={async (e) => {
                  const newStatus = e.target.value as StudentStatus;
                  // Only allow manual override to "Admitted" and only if balance is 0
                  if (newStatus === 'Admitted') {
                    if (balance > 0) {
                      if (!window.confirm(`Admit student with outstanding balance of ${formatTsh(balance)}? This is not recommended.`)) {
                        return;
                      }
                    }
                    await updateStudentStatus(student.id, 'Admitted');
                  }
                }}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium focus:ring-2 focus:ring-[#7c3aed] ${computedStatus === 'Admitted' ? 'bg-purple-50 border-purple-200 text-purple-700' : 'bg-slate-50 border-slate-300 text-slate-700 cursor-not-allowed'}`}
                disabled={computedStatus !== 'Admitted'}
              >
                <option value="Pending" disabled>Status: Pending (auto)</option>
                <option value="Partial" disabled>Status: Partial (auto)</option>
                <option value="Paid" disabled>Status: Paid (auto)</option>
                <option value="Admitted">Status: Admitted {balance > 0 ? '⚠' : '✓'}</option>
              </select>
              {computedStatus !== 'Admitted' && (
                <span className="absolute -top-5 right-0 text-[10px] text-slate-400 whitespace-nowrap">
                  Auto-computed
                </span>
              )}
            </div>

            <button
              onClick={() => setIsRecordPaymentOpen(true)}
              className="px-3.5 py-1.5 bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Record Payment</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Student Profile Card */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-emerald-100 text-[#16a34a] font-extrabold text-xl sm:text-2xl flex items-center justify-center shrink-0 border border-emerald-200 shadow-2xs overflow-hidden">
              {student.photo ? (
                <img src={student.photo} alt={`${student.firstName} ${student.lastName} passport photo`} className="w-full h-full object-cover" />
              ) : (
                student.firstName.charAt(0) + student.lastName.charAt(0)
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  {student.firstName} {student.middleName ? `${student.middleName} ` : ''}{student.lastName}
                </h1>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusConfig.color}`}>
                  {statusConfig.label}
                  {computedStatus !== student.status && (
                    <span className="ml-1 opacity-70">(stored: {storedStatusConfig.label})</span>
                  )}
                </span>
              </div>
              <div className="text-xs text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                <span className="font-mono font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                  {student.applicationNo}
                </span>
                <span>·</span>
                <span>Class: <strong className="text-slate-700">{grade?.name || 'Unassigned'}</strong></span>
                <span>·</span>
                <span>Academic Year: <strong className="text-slate-700">{student.academicYear}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 self-stretch md:self-auto justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Print Record
            </button>
          </div>
        </div>

        {/* 4 Analysis Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Total Fees */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Total Expected Fees
            </div>
            <div className="text-lg sm:text-xl font-bold font-mono text-slate-900 mt-1">
              {formatTsh(totalFees)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Based on {grade?.name || 'Class'} statement
            </div>
          </div>

          {/* Card 2: Total Paid */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Total Paid
            </div>
            <div className="text-lg sm:text-xl font-bold font-mono text-[#16a34a] mt-1">
              {formatTsh(paidAmount)}
            </div>
            <div className="text-[11px] text-emerald-600 mt-0.5">
              {payments.length} payment transactions recorded
            </div>
          </div>

          {/* Card 3: Balance */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Outstanding Balance
            </div>
            <div className={`text-lg sm:text-xl font-bold font-mono mt-1 ${
              balance > 0 ? 'text-amber-600' : 'text-[#16a34a]'
            }`}>
              {formatTsh(balance)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {balance === 0 ? 'Fully settled' : 'Installment pending'}
            </div>
          </div>

          {/* Card 4: Status */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Admission Status
            </div>
            <div className="text-base sm:text-lg font-bold text-slate-900 mt-1 flex items-center gap-1.5">
              {statusConfig.icon && <statusConfig.icon className={`w-5 h-5 ${statusConfig.iconColor}`} />}
              <span>{statusConfig.label}</span>
              {computedStatus !== student.status && (
                <span className="text-xs text-slate-400 ml-1">(stored: {storedStatusConfig.label})</span>
              )}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {computedStatus === 'Admitted' 
                ? `Admitted on ${new Date(student.createdAt).toLocaleDateString()}` 
                : `Registered on ${new Date(student.createdAt).toLocaleDateString()}`}
            </div>
          </div>
        </div>

        {/* 2-Column Section: Details & Fee Statement */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Student & Parent Details */}
          <div className="lg:col-span-6 space-y-6">
            {/* Student Info Card */}
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
                Student Bio Data
              </h2>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block">Gender</span>
                  <span className="font-semibold text-slate-800">{student.gender}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Date of Birth</span>
                  <span className="font-semibold text-slate-800">{student.dob}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 block">Residential Address</span>
                  <span className="font-semibold text-slate-800 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {student.address}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Previous School</span>
                  <span className="font-semibold text-slate-800">{student.previousSchool || 'None'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Academic Stream</span>
                  <span className="font-semibold text-slate-800">{grade?.name} ({student.academicYear})</span>
                </div>
                {student.additionalInfo && (
                  <div className="col-span-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-slate-400 block text-[11px]">
                      Additional Information:
                    </span>
                    <span className="text-slate-700">{student.additionalInfo}</span>
                  </div>
                )}
                {student.notes && (
                  <div className="col-span-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-slate-400 block text-[11px]">Special Notes:</span>
                    <span className="text-slate-700 italic">{student.notes}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Parent Info Card */}
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
                Parent / Guardian Contact
              </h2>
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 block">Full Name</span>
                  <span className="font-bold text-slate-900 text-sm">{student.parentName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Relationship to Student</span>
                  <span className="font-semibold text-slate-800 text-sm">{student.parentRelationship}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">National ID / ZAN ID</span>
                  <span className="font-mono font-semibold text-slate-800 text-sm">{student.parentNationalId}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Phone Number</span>
                  <a
                    href={`tel:${student.parentPhone}`}
                    className="font-mono font-bold text-[#16a34a] hover:underline flex items-center gap-1 text-sm mt-0.5"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    {student.parentPhone}
                  </a>
                </div>
                <div>
                  <span className="text-slate-400 block">Parent Address</span>
                  <span className="text-slate-800">{student.parentAddress}</span>
                </div>
              </div>
            </div>

            {/* Emergency Contact Card */}
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
                Emergency Contact
              </h2>
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 block">Full Name</span>
                  <span className="font-bold text-slate-900 text-sm">{student.emergencyContactName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Relationship to Student</span>
                  <span className="font-semibold text-slate-800 text-sm">{student.emergencyContactRelationship}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Phone Number</span>
                  <a
                    href={`tel:${student.emergencyContactPhone}`}
                    className="font-mono font-bold text-red-600 hover:underline flex items-center gap-1 text-sm mt-0.5"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    {student.emergencyContactPhone}
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Grade Fee Statement */}
          <div className="lg:col-span-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Official Grade Fee Statement
              </h2>
              <span className="text-xs text-purple-700 font-semibold">
                Classroom: {grade?.name}
              </span>
            </div>

            {grade ? (
              <FeeStatement grade={grade} />
            ) : (
              <div className="p-4 bg-white rounded-xl text-slate-500 text-xs">
                No fee statement available for this grade.
              </div>
            )}
          </div>
        </div>

        {/* Payment History Section */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Payment History
              </h3>
              <p className="text-xs text-slate-500">
                All verified transactions recorded for this student.
              </p>
            </div>

            <button
              onClick={() => setIsRecordPaymentOpen(true)}
              className="px-3 py-1.5 bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-xs font-semibold rounded-lg shadow-2xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record Payment</span>
            </button>
          </div>

          {payments.length === 0 ? (
            <div className="p-8 text-center text-slate-500 space-y-2">
              <ReceiptIcon className="w-8 h-8 text-slate-300 mx-auto" />
              <div className="text-sm font-medium text-slate-700">No Payments Recorded Yet</div>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                No admission fee or tuition installments have been received for {student.firstName}.
              </p>
              <button
                onClick={() => setIsRecordPaymentOpen(true)}
                className="mt-2 px-3.5 py-1.5 bg-[#16a34a] text-white text-xs font-semibold rounded-lg"
              >
                Record First Payment
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Receipt / Ref</th>
                    <th className="px-5 py-3">Channel / Method</th>
                    <th className="px-5 py-3">Details / Purpose</th>
                    <th className="px-5 py-3 text-right">Amount (TZS)</th>
                    <th className="px-5 py-3 text-right">Receipt</th>
                    <th className="px-5 py-3 text-right">Reallocate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.map((p) => {
                    const paymentBreakdown = allocationBreakdown
                      .map((fl) => {
                        const allocForPayment = fl.allocations.find((a) => a.paymentId === p.id);
                        if (!allocForPayment) return null;
                        return {
                          feeGroup: fl.feeLine.feeGroupName,
                          feeItem: fl.feeLine.feeItemLabel,
                          amount: allocForPayment.amount,
                        };
                      })
                      .filter((b): b is typeof b & { feeGroup: string; feeItem: string; amount: number } => b !== null);

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-5 py-3 font-medium text-slate-900 whitespace-nowrap">
                          {p.date}
                        </td>
                        <td className="px-5 py-3 font-mono text-purple-700 font-semibold whitespace-nowrap">
                          {p.reference}
                        </td>
                        <td className="px-5 py-3 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700">
                            {p.method === 'Mixx by Yas' && '📱 Mixx by Yas'}
                            {p.method === 'M-Pesa' && '🔴 M-Pesa'}
                            {p.method === 'Airtel Money' && '⚪ Airtel Money'}
                            {p.method === 'Bank' && '🏦 Bank Transfer'}
                            {p.method === 'Lipa Namba' && '💠 Lipa Namba'}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-slate-600">
                          {paymentBreakdown.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {paymentBreakdown.map((item, idx) => (
                                <span key={idx} className="px-1.5 py-0.5 text-[10px] bg-purple-50 text-purple-700 rounded">
                                  {item.feeItem}: {formatTsh(item.amount)}
                                </span>
                              ))}
                            </div>
                          ) : (
                            p.notes || 'School Fee Installment'
                          )}
                        </td>
                        <td className="px-5 py-3 text-right font-mono font-bold text-[#16a34a] tabular-nums whitespace-nowrap">
                          {formatTsh(p.amount)}
                        </td>
                        <td className="px-5 py-3 text-right whitespace-nowrap">
                          <button
                            onClick={() => setReceiptPaymentId(p.id)}
                            className="px-2.5 py-1 text-xs font-semibold text-purple-700 hover:bg-purple-50 rounded-lg transition-colors flex items-center justify-end gap-1"
                            title="View Receipt"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Receipt</span>
                          </button>
                        </td>
                        <td className="px-5 py-3 text-right whitespace-nowrap">
                          <button
                            onClick={() => setReallocationPaymentId(p.id)}
                            className="px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50 rounded-lg transition-colors flex items-center justify-end gap-1"
                            title="Reallocate Payment"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Reallocate</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 font-bold border-t border-slate-200">
                    <td colSpan={5} className="px-5 py-3 text-right text-slate-700 uppercase">
                      Total Payments Verified:
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-emerald-700 text-sm">
                      {formatTsh(paidAmount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Record Payment Modal */}
      <PaymentModal
        isOpen={isRecordPaymentOpen}
        onClose={() => setIsRecordPaymentOpen(false)}
        student={student}
        defaultAmount={balance > 0 ? Math.min(balance, 150000) : 150000}
        title={`Record Payment for ${student.firstName} ${student.lastName}`}
      />

      {/* Receipt Modal */}
      {receiptPaymentId && (
        <ReceiptModal
          isOpen={true}
          onClose={() => setReceiptPaymentId(null)}
          student={student}
          payment={payments.find((p) => p.id === receiptPaymentId)!}
          gradeName={grade?.name}
          feeLines={allocationBreakdown}
          account={{
            totalFees: account?.totalFees || totalFees,
            totalPaid: account?.totalPaid || paidAmount,
            balance: account?.balance || balance,
            credit: account?.credit || credit,
          }}
        />
      )}

      {/* Reallocation Modal */}
      {reallocationPaymentId && (
        <ReallocationModal
          isOpen={true}
          onClose={() => setReallocationPaymentId(null)}
          student={student}
          payment={payments.find((p) => p.id === reallocationPaymentId)!}
          grade={grade!}
          feeLines={feeLines}
          currentAllocations={allocationBreakdown.flatMap((ab) => ab.allocations)}
          onSuccess={() => {}}
        />
      )}
      </div>
    </div>
  );
};
