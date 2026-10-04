import React, { useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CreditCard,
  FileText,
  GraduationCap,
  Phone,
  Printer,
  ShieldCheck,
} from 'lucide-react';
import { schoolConfig } from '../config/schoolConfig';
import { useApp } from '../context/AppContext';
import { Student } from '../types';
import { FeeStatement } from '../components/FeeStatement';
import { FeeModal } from '../components/FeeModal';
import { PaymentModal } from '../components/PaymentModal';
import { AdminRegisterForm } from '../components/AdminRegisterForm';

interface ApplyPageProps {
  onNavigate: (path: string) => void;
  isModalMode?: boolean;
  onSuccessClose?: () => void;
}

export const ApplyPage: React.FC<ApplyPageProps> = ({
  onNavigate,
  isModalMode = false,
  onSuccessClose,
}) => {
  const { grades, getGradeById } = useApp();

  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [submittedStudent, setSubmittedStudent] = useState<Student | null>(null);
  const [isFeesModalOpen, setIsFeesModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // ================= CONFIRMATION VIEW =================
  if (submittedStudent) {
    const studentGrade = getGradeById(submittedStudent.gradeId) || grades[0];
    return (
      <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Header */}
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 text-center">
            <div className="w-16 h-16 bg-emerald-100 text-[#16a34a] rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <span className="inline-block bg-emerald-50 text-emerald-800 text-xs font-semibold px-3 py-1 rounded-full border border-emerald-200 mb-2">
              Application Submitted Successfully
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Application Confirmation
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-md mx-auto">
              Thank you for applying to <span className="font-semibold text-slate-900">{schoolConfig.name}</span>. Your application file has been registered.
            </p>

            {/* Application number card */}
            <div className="mt-5 p-4 bg-slate-50 rounded-xl border border-dashed border-slate-300 max-w-sm mx-auto">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Official Application Number
              </div>
              <div className="text-2xl font-mono font-extrabold text-[#7c3aed] mt-0.5">
                {submittedStudent.applicationNo}
              </div>
              <div className="text-xs text-slate-600 mt-1">
                Student: <span className="font-semibold text-slate-900">{submittedStudent.firstName} {submittedStudent.lastName}</span> · {studentGrade.name}
              </div>
            </div>
          </div>

          {/* Child's Grade Fee Statement in exact format */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Fee Statement for {studentGrade.name} 
              </h2>
              <span className="text-xs text-slate-500">
                Academic Year {submittedStudent.academicYear}
              </span>
            </div>
            {studentGrade && <FeeStatement grade={studentGrade} />}
          </div>

          {/* Next Steps & Mock Payment Action */}
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Next Step: Pay Admission Fee
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              To secure your child's entrance interview and slot evaluation, please pay the non-refundable admission fee (150,000 Tsh) using M-Pesa, Mixx by Yas, Airtel Money, or Direct Bank Deposit.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => setIsPaymentModalOpen(true)}
                className="flex-1 py-3 px-4 bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold rounded-lg text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <CreditCard className="w-4 h-4" />
                <span>Pay Admission Fee (150,000 Tsh)</span>
              </button>

              <button
                onClick={() => window.print()}
                className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Slip</span>
              </button>
            </div>

            <div className="border-t border-slate-100 pt-3 text-xs text-slate-500 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                Helpline: {schoolConfig.phone}
              </span>
              {isModalMode && onSuccessClose ? (
                <button
                  onClick={onSuccessClose}
                  className="font-medium text-[#7c3aed] hover:underline"
                >
                  Close & Return
                </button>
              ) : (
                <button
                  onClick={() => onNavigate('/')}
                  className="font-medium text-[#7c3aed] hover:underline cursor-pointer"
                >
                  Return to Home
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mock Payment Modal */}
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          student={submittedStudent}
          isAdmissionFeeOnly={true}
          title="Pay Admission Fee"
        />
      </div>
    );
  }

  // ================= ADMISSION FORM VIEW =================
  return (
    <div className="min-h-screen bg-slate-100 pb-16">
      {/* Centered white header with logo, green school name, grey "Online Admission System" */}
      <div className="bg-white border-b border-slate-200 py-6 px-4 shadow-xs">
        <div className="max-w-4xl mx-auto flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#16a34a] to-emerald-500 text-white flex items-center justify-center shadow-md mb-2">
            <GraduationCap className="w-8 h-8" />
          </div>

          <h1 className="text-xl sm:text-2xl font-extrabold text-[#16a34a] tracking-tight">
            {schoolConfig.name}
          </h1>

          <div className="text-xs sm:text-sm font-medium text-slate-500 uppercase tracking-widest mt-0.5">
            Online Admission System
          </div>

          {/* Back Home on the left, Show Fees on the right */}
          <div
            className={`mt-3 flex w-full max-w-4xl items-center gap-3 ${
              isModalMode ? 'justify-end' : 'justify-between'
            }`}
          >
            {!isModalMode && (
              <button
                type="button"
                onClick={() => onNavigate('/')}
                className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Home</span>
              </button>
            )}

            {/* Small outlined purple "Show Fees" button */}
            <button
              type="button"
              onClick={() => setIsFeesModalOpen(true)}
              className="ml-auto px-3.5 py-1.5 rounded-lg border-2 border-[#7c3aed] text-[#7c3aed] hover:bg-purple-50 text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Show Fees</span>
            </button>
          </div>
        </div>
      </div>

      {/* Shared registration form — identical to admin "Register New Student" */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
        <AdminRegisterForm
          variant="public"
          onSaved={(student) => {
            setSubmittedStudent(student);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onViewStudent={() => setIsFeesModalOpen(true)}
          onCancel={() => onNavigate('/')}
        />

        {/* Green Consent Text as specified in prompt */}
        <div className="mt-6 bg-emerald-50/90 border-l-4 border-[#16a34a] p-4 rounded-r-xl space-y-1">
          <div className="text-xs sm:text-sm font-semibold text-emerald-950">
            Notice &amp; Terms of Admission:
          </div>
          <p className="text-xs text-emerald-900 leading-relaxed">
            Admission is not guaranteed and depends on interview and slot availability; the admission fee is non-refundable; for help call the school phone{' '}
            <a
              href={`tel:${schoolConfig.phone.replace(/\s+/g, '')}`}
              className="font-bold underline text-emerald-950"
            >
              {schoolConfig.phone}
            </a>
            .
          </p>
        </div>

        {/* Collapsible "Privacy Notice" */}
        <div className="mt-4 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
          <button
            type="button"
            onClick={() => setPrivacyOpen(!privacyOpen)}
            className="w-full px-4 py-3 text-left flex items-center justify-between text-xs sm:text-sm font-semibold text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#16a34a]" />
              <span>Privacy Notice</span>
            </div>
            {privacyOpen ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {privacyOpen && (
            <div className="px-4 pb-4 pt-1 text-xs text-slate-600 border-t border-slate-100 space-y-2 leading-relaxed bg-slate-50/50">
              <p>
                All personal data supplied in this form (student identity, birth dates, guardian phone numbers and addresses) will be used solely for the evaluation of enrollment and official educational administration at <strong>{schoolConfig.name}</strong> in accordance with educational guidelines in Zanzibar and the United Republic of Tanzania.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Fee Structure Modal — swings in from the right like a door */}
      <FeeModal
        isOpen={isFeesModalOpen}
        onClose={() => setIsFeesModalOpen(false)}
      />
    </div>
  );
};