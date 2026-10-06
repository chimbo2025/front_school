import React, { useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  CreditCard,
  Eraser,
  GraduationCap,
  Phone,
  Receipt,
  RotateCcw,
  Save,
  User,
  Users,
  Wallet,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatNumber, schoolConfig } from '../config/schoolConfig';
import { Gender, Relationship, Student } from '../types';
import { FeeStatement } from './FeeStatement';

interface AdminRegisterFormProps {
  /** Called after a student is saved, so the shell can jump tabs. */
  onSaved: (student: Student) => void;
  onViewStudent: (studentId: string) => void;
  onCancel: () => void;
  /**
   * 'admin' shows staff-only fields (internal notes) and internal copy.
   * 'public' is the public admission application form on the landing page.
   */
  variant?: 'admin' | 'public';
}

type Errors = Record<string, string>;

const EMPTY_FORM = {
  firstName: '',
  middleName: '',
  lastName: '',
  gender: 'Male' as Gender,
  dob: '',
  address: '',
  parentName: '',
  parentPhone: '',
  parentAddress: '',
  parentRelationship: 'Father' as Relationship,
  parentNationalId: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  emergencyContactRelationship: 'Guardian' as Relationship,
  gradeId: '',
  academicYear: schoolConfig.academicYears[0] || '2026/2027',
  previousSchool: '',
  additionalInfo: '',
  notes: '',
};

const labelCls = 'block text-xs font-semibold text-slate-700 mb-1';
const inputCls =
  'w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/40 focus:border-[#7c3aed]';

const SectionCard: React.FC<{
  step: number;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}> = ({ step, icon: Icon, title, subtitle, children }) => (
  <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
    <header className="flex items-center gap-3 px-4 sm:px-5 py-3.5 bg-slate-50 border-b border-slate-200">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#7c3aed] text-white">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <h3 className="text-sm font-bold text-slate-900 leading-tight">{title}</h3>
        <p className="text-[11px] text-slate-500">{subtitle}</p>
      </div>
      <span className="ml-auto shrink-0 font-mono text-[10px] font-bold text-slate-400">
        STEP {step}
      </span>
    </header>
    <div className="p-4 sm:p-5 space-y-4">{children}</div>
  </section>
);

const ErrorText: React.FC<{ children?: string }> = ({ children }) =>
  children ? (
    <p className="mt-1 flex items-start gap-1 text-[11px] font-medium text-red-600">
      <AlertCircle className="mt-px h-3 w-3 shrink-0" />
      <span>{children}</span>
    </p>
  ) : null;

export const AdminRegisterForm: React.FC<AdminRegisterFormProps> = ({
  onSaved,
  onViewStudent,
  onCancel,
  variant = 'admin',
}) => {
  const { grades, addStudent, getGradeById, getStudentTotalFees } = useApp();
  const isPublic = variant === 'public';

  const [form, setForm] = useState({ ...EMPTY_FORM, gradeId: grades[0]?.id || '' });
  const [errors, setErrors] = useState<Errors>({});
  const [saved, setSaved] = useState<Student | null>(null);
  const formTopRef = useRef<HTMLDivElement | null>(null);

  const selectedGrade = useMemo(
    () => (form.gradeId ? getGradeById(form.gradeId) : undefined),
    [form.gradeId, getGradeById]
  );

  const set = (key: keyof typeof EMPTY_FORM, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const resetForm = () => {
    setForm({ ...EMPTY_FORM, gradeId: grades[0]?.id || '' });
    setErrors({});
    setSaved(null);
    requestAnimationFrame(() => formTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  const validate = (): Errors => {
    const next: Errors = {};
    if (!form.firstName.trim()) next.firstName = 'First name is required.';
    if (!form.lastName.trim()) next.lastName = 'Last name is required.';
    if (!form.dob) next.dob = 'Date of birth is required.';
    if (!form.address.trim()) next.address = 'Student address is required.';
    if (!form.parentName.trim()) next.parentName = 'Parent or guardian name is required.';

    const phone = form.parentPhone.replace(/[\s-]/g, '');
    if (!phone) next.parentPhone = 'Parent phone is required.';
    else if (!/^0\d{9}$/.test(phone)) next.parentPhone = 'Use 10 digits starting with 0 (e.g. 0778407818).';

    if (!form.parentAddress.trim()) next.parentAddress = 'Parent address is required.';

    if (!form.parentNationalId.trim()) next.parentNationalId = 'Parent National ID or ZAN ID is required.';

    const emergencyPhone = form.emergencyContactPhone.replace(/[\s-]/g, '');
    if (!form.emergencyContactName.trim()) next.emergencyContactName = 'Emergency contact name is required.';
    if (!emergencyPhone) next.emergencyContactPhone = 'Emergency contact phone is required.';
    else if (!/^0\d{9}$/.test(emergencyPhone)) next.emergencyContactPhone = 'Use 10 digits starting with 0 (e.g. 0778407818).';

    if (!form.gradeId) next.gradeId = 'Select a classroom.';
    return next;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      requestAnimationFrame(() => {
        formTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      return;
    }

    try {
      const created = await addStudent({
        firstName: form.firstName.trim(),
        middleName: form.middleName.trim() || undefined,
        lastName: form.lastName.trim(),
        gender: form.gender,
        dob: form.dob,
        address: form.address.trim(),
        parentName: form.parentName.trim(),
        parentPhone: form.parentPhone.replace(/[\s-]/g, ''),
        parentAddress: form.parentAddress.trim(),
        parentRelationship: form.parentRelationship,
        parentNationalId: form.parentNationalId.trim(),
        emergencyContactName: form.emergencyContactName.trim(),
        emergencyContactPhone: form.emergencyContactPhone.replace(/[\s-]/g, ''),
        emergencyContactRelationship: form.emergencyContactRelationship,
        gradeId: form.gradeId,
        academicYear: form.academicYear,
        previousSchool: form.previousSchool.trim() || undefined,
        additionalInfo: form.additionalInfo.trim() || undefined,
        notes: form.notes.trim() || undefined,
        status: 'Pending',
      });

      setSaved(created);
      onSaved(created);
    } catch (err) {
      setErrors({ submit: err instanceof Error ? err.message : 'Failed to submit application' });
      requestAnimationFrame(() => {
        formTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  };

  const errorList = Object.entries(errors).filter(([, v]) => v);

  /* ---------------- SUCCESS STATE ---------------- */
  if (saved) {
    const grade = getGradeById(saved.gradeId);
    const totalDue = getStudentTotalFees(saved.id);

    return (
      <div className="mx-auto w-full max-w-3xl space-y-5">
        <div className="bg-white rounded-2xl border border-emerald-200 shadow-sm overflow-hidden">
          <div className="bg-emerald-50 px-5 py-4 border-b border-emerald-200 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#16a34a] text-white">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Registration Complete</h3>
              <p className="text-xs text-slate-600">
                Student file created and added to the register.
              </p>
            </div>
          </div>

          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Application Number
                </div>
                <div className="font-mono text-xl font-extrabold text-[#7c3aed]">
                  {saved.applicationNo}
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 p-4">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Status
                </div>
                <div className="mt-1 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-full inline-block">
                  Pending
                </div>
              </div>
            </div>

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
              {[
                ['Student', `${saved.firstName} ${saved.middleName ? `${saved.middleName} ` : ''}${saved.lastName}`],
                ['Classroom', grade?.name || '—'],
                ['Gender', saved.gender],
                ['Academic Year', saved.academicYear],
                ['Parent / Guardian', saved.parentName],
                ['Relationship', saved.parentRelationship],
                ['National ID / ZAN ID', saved.parentNationalId],
                ['Phone', saved.parentPhone],
                ['Emergency Contact', saved.emergencyContactName],
                ['Relationship', saved.emergencyContactRelationship],
                ['Emergency Phone', saved.emergencyContactPhone],
              ].map(([k, v]) => (
                <div key={k} className="flex items-baseline justify-between gap-3 border-b border-slate-100 pb-2">
                  <dt className="text-xs font-semibold text-slate-500">{k}</dt>
                  <dd className="text-xs font-semibold text-slate-900 text-right">{v}</dd>
                </div>
              ))}
            </dl>

            <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-900">
                <Wallet className="h-4 w-4 text-[#16a34a]" />
                Total Fee Due
              </span>
              <span className="font-mono font-extrabold text-[#16a34a]">
                {formatNumber(totalDue)} Tsh
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <button
                onClick={resetForm}
                className="flex-1 py-2.5 px-4 bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-xl text-xs font-bold shadow-sm transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Register Another Student</span>
              </button>
              <button
                onClick={() => onViewStudent(saved.id)}
                className="flex-1 py-2.5 px-4 border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2"
              >
                <BadgeCheck className="h-4 w-4" />
                <span>Open Student File</span>
              </button>
              <button
                onClick={onCancel}
                className="py-2.5 px-4 text-slate-500 hover:text-slate-900 text-xs font-semibold transition-colors"
              >
                Back to Register
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ---------------- FORM STATE ---------------- */
  return (
    <div ref={formTopRef} className="grid grid-cols-1 xl:grid-cols-12 gap-5 scroll-mt-24">
      {/* ---------- Left: form sections ---------- */}
      <form onSubmit={handleSubmit} className="xl:col-span-8 space-y-5">
        {/* Error summary */}
        {errorList.length > 0 && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
            <div className="flex items-center gap-2 text-xs font-bold text-red-800">
              <AlertCircle className="h-4 w-4" />
              {errorList.length} field{errorList.length > 1 ? 's need' : ' needs'} attention before
              saving
            </div>
            <ul className="mt-1.5 grid grid-cols-1 sm:grid-cols-2 gap-x-4 text-[11px] text-red-700">
              {errorList.map(([k, v]) => (
                <li key={k} className="truncate">
                  • {v}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Section 1: Student */}
        <SectionCard step={1} icon={User} title="Student Details" subtitle="Identity of the child being enrolled">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.firstName}
                onChange={(e) => set('firstName', e.target.value)}
                placeholder="Amina"
                autoFocus
                className={`${inputCls} ${errors.firstName ? 'border-red-400 bg-red-50/50' : ''}`}
              />
              <ErrorText>{errors.firstName}</ErrorText>
            </div>
            <div>
              <label className={labelCls}>Middle Name</label>
              <input
                type="text"
                value={form.middleName}
                onChange={(e) => set('middleName', e.target.value)}
                placeholder="Hassan"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.lastName}
                onChange={(e) => set('lastName', e.target.value)}
                placeholder="Juma"
                className={`${inputCls} ${errors.lastName ? 'border-red-400 bg-red-50/50' : ''}`}
              />
              <ErrorText>{errors.lastName}</ErrorText>
            </div>
            <div>
              <label className={labelCls}>
                Gender <span className="text-red-500">*</span>
              </label>
              <select
                value={form.gender}
                onChange={(e) => set('gender', e.target.value)}
                className={`${inputCls} cursor-pointer`}
              >
                {(['Male', 'Female'] as Gender[]).map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>
                Date of Birth <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={form.dob}
                onChange={(e) => set('dob', e.target.value)}
                className={`${inputCls} font-mono ${errors.dob ? 'border-red-400 bg-red-50/50' : ''}`}
              />
              <ErrorText>{errors.dob}</ErrorText>
            </div>
          </div>

          <div>
            <label className={labelCls}>
              Residential Address <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => set('address', e.target.value)}
              placeholder="e.g. Mwanakwerekwe, Unguja"
              className={`${inputCls} ${errors.address ? 'border-red-400 bg-red-50/50' : ''}`}
            />
            <ErrorText>{errors.address}</ErrorText>
          </div>
        </SectionCard>

        {/* Section 2: Parent */}
        <SectionCard step={2} icon={Users} title="Parent / Guardian" subtitle="Who will be billed and contacted">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.parentName}
                onChange={(e) => set('parentName', e.target.value)}
                placeholder="e.g. Bi Mwanaisha Ali"
                className={`${inputCls} ${errors.parentName ? 'border-red-400 bg-red-50/50' : ''}`}
              />
              <ErrorText>{errors.parentName}</ErrorText>
            </div>
            <div>
              <label className={labelCls}>
                Relationship to Student <span className="text-red-500">*</span>
              </label>
              <select
                value={form.parentRelationship}
                onChange={(e) => set('parentRelationship', e.target.value)}
                className={`${inputCls} cursor-pointer`}
              >
                {(['Father', 'Mother', 'Guardian', 'Grandparent', 'Sibling', 'Other'] as Relationship[]).map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>
                National ID / ZAN ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.parentNationalId}
                onChange={(e) => set('parentNationalId', e.target.value)}
                placeholder="e.g. 1980123456789 or ZAN123456"
                className={`${inputCls} ${errors.parentNationalId ? 'border-red-400 bg-red-50/50' : ''}`}
              />
              <ErrorText>{errors.parentNationalId}</ErrorText>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>
                Mobile Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="tel"
                  inputMode="numeric"
                  value={form.parentPhone}
                  onChange={(e) => set('parentPhone', e.target.value)}
                  placeholder="0778407818"
                  className={`${inputCls} pl-9 font-mono ${
                    errors.parentPhone ? 'border-red-400 bg-red-50/50' : ''
                  }`}
                />
              </div>
              <ErrorText>{errors.parentPhone}</ErrorText>
            </div>
          </div>

          <div>
            <label className={labelCls}>
              Home Address <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={2}
              value={form.parentAddress}
              onChange={(e) => set('parentAddress', e.target.value)}
              placeholder="e.g. Chukwani Beach Road, Unguja"
              className={`${inputCls} resize-none ${
                errors.parentAddress ? 'border-red-400 bg-red-50/50' : ''
              }`}
            />
            <ErrorText>{errors.parentAddress}</ErrorText>
          </div>
        </SectionCard>

        {/* Section 2b: Emergency Contact */}
        <SectionCard step={2} icon={Phone} title="Emergency Contact" subtitle="Secondary contact in case parent/guardian is unreachable">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.emergencyContactName}
                onChange={(e) => set('emergencyContactName', e.target.value)}
                placeholder="e.g. Bi Fatuma Hassan"
                className={`${inputCls} ${errors.emergencyContactName ? 'border-red-400 bg-red-50/50' : ''}`}
              />
              <ErrorText>{errors.emergencyContactName}</ErrorText>
            </div>
            <div>
              <label className={labelCls}>
                Relationship to Student <span className="text-red-500">*</span>
              </label>
              <select
                value={form.emergencyContactRelationship}
                onChange={(e) => set('emergencyContactRelationship', e.target.value)}
                className={`${inputCls} cursor-pointer`}
              >
                {(['Father', 'Mother', 'Guardian', 'Grandparent', 'Sibling', 'Other'] as Relationship[]).map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelCls}>
              Mobile Number <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="tel"
                inputMode="numeric"
                value={form.emergencyContactPhone}
                onChange={(e) => set('emergencyContactPhone', e.target.value)}
                placeholder="0778407818"
                className={`${inputCls} pl-9 font-mono ${
                  errors.emergencyContactPhone ? 'border-red-400 bg-red-50/50' : ''
                }`}
              />
            </div>
            <ErrorText>{errors.emergencyContactPhone}</ErrorText>
          </div>
        </SectionCard>

        {/* Section 3: Enrolment */}
        <SectionCard step={3} icon={GraduationCap} title="Enrolment Details" subtitle="Classroom placement and academic year">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>
                Classroom <span className="text-red-500">*</span>
              </label>
              <select
                value={form.gradeId}
                onChange={(e) => set('gradeId', e.target.value)}
                className={`${inputCls} ${errors.gradeId ? 'border-red-400 bg-red-50/50' : ''}`}
              >
                {grades.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                    {g.ageRange ? ` · Ages ${g.ageRange}` : ''}
                  </option>
                ))}
              </select>
              <ErrorText>{errors.gradeId}</ErrorText>
            </div>
            <div>
              <label className={labelCls}>Academic Year</label>
              <select
                value={form.academicYear}
                onChange={(e) => set('academicYear', e.target.value)}
                className={inputCls}
              >
                {schoolConfig.academicYears.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Previous School</label>
              <input
                type="text"
                value={form.previousSchool}
                onChange={(e) => set('previousSchool', e.target.value)}
                placeholder="Optional — e.g. Kiembesamaki Nursery"
                className={inputCls}
              />
            </div>

            {!isPublic && (
              <div>
                <label className={labelCls}>Internal Notes</label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => set('notes', e.target.value)}
                  placeholder="Optional — medical needs, dietary notes, transport request, sibling info..."
                  className={`${inputCls} resize-none`}
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  Visible to staff only. Never shown on the public portal.
                </p>
              </div>
            )}
          </div>

          <div>
            <label className={labelCls}>
              Description
              <span className="ml-1.5 font-normal text-slate-400">(optional)</span>
            </label>
            <textarea
              rows={3}
              value={form.additionalInfo}
              onChange={(e) => set('additionalInfo', e.target.value)}
              placeholder={
                isPublic
                  ? 'Optional — health or learning needs, transport required, sibling already enrolled, preferred pickup point, how to reach you on WhatsApp...'
                  : 'Optional — sibling already enrolled, transport required, preferred pickup point, health or learning needs, contact on WhatsApp...'
              }
              className={`${inputCls} resize-y`}
            />
            <p className="mt-1 text-[11px] text-slate-400">
              {isPublic
                ? 'Anything the school should know about your child. Leave blank if there is nothing to add.'
                : 'Saved with the student file for staff reference. Leave blank if there is nothing to add.'}
            </p>
          </div>
        </SectionCard>

        {/* Action bar */}
        <div className="sticky bottom-4 flex flex-col sm:flex-row items-center gap-2 rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 shadow-lg backdrop-blur-md">
          <button
            type="button"
            onClick={() => {
              setForm({ ...EMPTY_FORM, gradeId: grades[0]?.id || '' });
              setErrors({});
            }}
            className="flex items-center gap-1.5 py-2.5 px-3 text-xs font-semibold text-slate-500 transition-colors hover:text-slate-900"
          >
            <Eraser className="h-3.5 w-3.5" />
            <span>Clear form</span>
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="py-2.5 px-4 text-xs font-semibold text-slate-500 transition-colors hover:text-slate-900"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="ml-auto w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-[#7c3aed] px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-[#6d28d9]"
          >
            {isPublic ? <CreditCard className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            <span>{isPublic ? 'Submit Application' : 'Save Student File'}</span>
          </button>
        </div>
      </form>

      {/* ---------- Right: live summary ---------- */}
      <aside className="xl:col-span-4 space-y-4">
        <div className="xl:sticky xl:top-24 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3">
              <Receipt className="h-4 w-4 text-[#7c3aed]" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Fee Preview
              </h4>
              {selectedGrade && (
                <span className="ml-auto rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                  Live
                </span>
              )}
            </div>
            {selectedGrade ? (
              <FeeStatement grade={selectedGrade} className="rounded-none border-0 shadow-none" />
            ) : (
              <p className="px-4 py-6 text-center text-xs text-slate-500">
                Select a classroom to preview fees.
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
            <h4 className="text-xs font-bold text-blue-900">What happens next</h4>
            <ol className="mt-2 space-y-1.5">
              {(isPublic
                ? [
                    'Your application file is saved with an official application number.',
                    'Pay the non-refundable admission fee (150,000 Tsh) to secure the interview slot.',
                    'Attend the entrance interview; results and class placement are confirmed by the school.',
                  ]
                : [
                    'File is saved with status "Pending" and an auto application number.',
                    'Verify the interview and confirm the admission fee at the counter.',
                    'Mark the student "Admitted" once the fee is confirmed.',
                  ]
              ).map((step, i) => (
                <li key={i} className="flex gap-2 text-[11px] leading-relaxed text-blue-800">
                  <span className="mt-px flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-blue-600 font-mono text-[9px] font-bold text-white">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <h4 className="text-xs font-bold text-slate-900">Bursar contact</h4>
            <a
              href={`tel:${schoolConfig.phone.replace(/\s+/g, '')}`}
              className="mt-1 flex items-center gap-2 font-mono text-sm font-bold text-[#16a34a] hover:underline"
            >
              <Phone className="h-3.5 w-3.5" />
              {schoolConfig.phone}
            </a>
            <p className="mt-1 text-[11px] text-slate-500">
              {isPublic
                ? 'Quote the application number when you call about fees.'
                : 'Quote the application number when the parent calls about fees.'}
            </p>
            <button
              type="button"
              onClick={onCancel}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 py-2 text-[11px] font-semibold text-slate-600 transition-colors hover:bg-slate-50"
            >
              {isPublic ? 'Back to Home' : 'Back to Students'}
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
};