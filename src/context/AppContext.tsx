import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import {
  Grade, Student, Payment, StudentStatus, PaymentMethod, FinanceSummary, Relationship, FeeItem, FeeGroup,
  Allocation, FeeLine, StudentAccount, PaymentClaim, AppSettings, AllocationRule, StatementRow,
  StatementImport, AuditEntry, AuditAction, ClaimStatus,
} from '../types';
import { api, Grade as ApiGrade, Student as ApiStudent, StudentListItem, Payment as ApiPayment, ApiError } from '../services/api';
import { authService } from '../services/auth';
import {
  computeStudentAccount, allocatePayment, getAllocationBreakdown as libGetAllocationBreakdown,
  hasDuplicateTransactionId, DEFAULT_ALLOCATION_PRIORITY, buildFeeLines,
  reallocatePayment as libReallocatePayment,
} from '../lib';

interface AppContextType {
  grades: Grade[];
  students: Student[];
  payments: Payment[];
  allocations: Allocation[];
  claims: PaymentClaim[];
  statementRows: StatementRow[];
  statementImports: StatementImport[];
  auditEntries: AuditEntry[];
  settings: AppSettings;
  loading: boolean;
  error: string | null;
  addStudent: (student: Omit<Student, 'id' | 'applicationNo' | 'status' | 'createdAt'> & { status?: StudentStatus }) => Promise<Student>;
  updateStudent: (id: string, data: Partial<Student>) => Promise<void>;
  updateStudentStatus: (id: string, status: StudentStatus) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;
  addPayment: (payment: Omit<Payment, 'id'>) => Promise<Payment>;
  addGrade: (grade: Omit<Grade, 'id'>) => Promise<Grade>;
  updateGrade: (id: string, data: Partial<Grade>) => Promise<void>;
  deleteGrade: (id: string) => Promise<void>;
  getGradeById: (id: string) => Grade | undefined;
  getGradeTotalFees: (grade: Grade) => number;
  getStudentById: (id: string) => Student | undefined;
  getStudentPayments: (studentId: string) => Payment[];
  getStudentTotalFees: (studentId: string) => number;
  getStudentPaidAmount: (studentId: string) => number;
  getStudentBalance: (studentId: string) => number;
  getStudentCredit: (studentId: string) => number;
  getStudentAccount: (studentId: string) => StudentAccount | null;
  getStudentComputedStatus: (studentId: string) => StudentStatus;
  getAllocationBreakdown: (studentId: string) => Array<{ feeLine: FeeLine; paid: number; due: number; status: 'UNPAID' | 'PARTIAL' | 'PAID'; allocations: Allocation[] }>;
  getStudentClaims: (studentId: string) => PaymentClaim[];
  submitClaim: (claim: {
    studentId: string; amount: number; transactionId: string; paymentDate: string;
    payerPhone: string; method?: PaymentMethod; screenshot?: string; notes?: string;
  }) => Promise<PaymentClaim>;
  approveClaim: (claimId: string, options?: { reviewedBy?: string; reason?: string }) => Promise<{ claim: PaymentClaim; payment: Payment }>;
  rejectClaim: (claimId: string, reason: string, reviewedBy?: string) => Promise<PaymentClaim>;
  scanNotFound: (performedBy?: string) => Promise<{ not_found: string[]; restored: string[]; days: number }>;
  refreshClaims: () => Promise<void>;
  importStatement: (payload: {
    fileName: string; fileHash: string; mapping: AppSettings['csvMapping'];
    uploadedBy?: string; rows: unknown[]; matches: unknown[];
  }) => Promise<{ importedRows: number; skippedRows: number; payments: Payment[] }>;
  assignStatementRow: (rowId: string, studentId: string, note?: string, performedBy?: string) => Promise<Payment>;
  refreshStatements: () => Promise<void>;
  reallocatePayment: (args: {
    paymentId: string; studentId: string; targetFeeLineId: string; amount: number;
    reason: string; performedBy: string;
  }) => Promise<void>;
  updateSettings: (partial: Partial<AppSettings>, performedBy?: string) => Promise<void>;
  refreshAudit: () => Promise<void>;
  logAudit: (entry: { studentId?: string; paymentId?: string; action: AuditAction; performedBy: string; reason?: string; before?: Record<string, unknown>; after?: Record<string, unknown> }) => Promise<void>;
  financeSummary: FinanceSummary;
  monthlyCollections: { month: string; amount: number }[];
  feeTypeBreakdown: { name: string; amount: number; percentage: number; color: string }[];
  refetch: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function mapApiGrade(g: ApiGrade): Grade {
  return {
    id: g.id,
    name: g.name,
    description: g.description,
    ageRange: g.age_range,
    feeGroups: (g.fee_groups || []).map(fg => ({
      id: fg.id,
      name: fg.name,
      items: (fg.items || []).map(i => ({ id: i.id, label: i.label, amount: i.amount }))
    }))
  };
}

function mapApiStudent(s: ApiStudent | StudentListItem): Student {
  return {
    id: s.id,
    applicationNo: s.application_no,
    firstName: s.first_name,
    middleName: s.middle_name,
    lastName: s.last_name,
    gender: s.gender,
    dob: s.dob,
    address: s.address,
    parentName: s.parent_name,
    parentPhone: s.parent_phone,
    parentAddress: 'parent_address' in s ? s.parent_address : '',
    parentRelationship: s.parent_relationship,
    parentNationalId: s.parent_national_id,
    emergencyContactName: s.emergency_contact_name,
    emergencyContactPhone: s.emergency_contact_phone,
    emergencyContactRelationship: s.emergency_contact_relationship,
    gradeId: typeof s.grade === 'object' ? s.grade.id : s.grade,
    academicYear: s.academic_year,
    previousSchool: 'previous_school' in s ? s.previous_school : undefined,
    additionalInfo: 'additional_info' in s ? s.additional_info : undefined,
    notes: 'notes' in s ? s.notes : undefined,
    status: s.status,
    createdAt: s.created_at,
    photo: 'photo' in s ? s.photo : undefined,
  };
}

function mapApiPayment(p: ApiPayment): Payment {
  return {
    id: p.id,
    studentId: p.student,
    amount: p.amount,
    method: p.method,
    date: p.date,
    reference: p.reference,
    notes: p.notes,
  };
}

const emptyFinanceSummary: FinanceSummary = {
  totalExpected: 0,
  totalCollected: 0,
  outstanding: 0,
  collectionRate: 0,
};

const emptyFeeTypeBreakdown = [
  { name: 'School Tuition Fee', amount: 0, percentage: 0, color: '#16a34a' },
  { name: 'Transport Bus Fee', amount: 0, percentage: 0, color: '#2563eb' },
  { name: 'Admission & Kit Fee', amount: 0, percentage: 0, color: '#7c3aed' },
];

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [claims, setClaims] = useState<PaymentClaim[]>([]);
  const [statementRows, setStatementRows] = useState<StatementRow[]>([]);
  const [statementImports, setStatementImports] = useState<StatementImport[]>([]);
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    allocationOrder: DEFAULT_ALLOCATION_PRIORITY,
    notFoundDays: 3,
    csvMapping: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [financeSummary, setFinanceSummary] = useState<FinanceSummary>(emptyFinanceSummary);
  const [monthlyCollections] = useState<{ month: string; amount: number }[]>([
    { month: 'Oct 25', amount: 1450000 },
    { month: 'Nov 25', amount: 2300000 },
    { month: 'Dec 25', amount: 3100000 },
    { month: 'Jan 26', amount: 8250000 },
    { month: 'Feb 26', amount: 4850000 },
    { month: 'Mar 26', amount: 1950000 },
  ]);
  const [feeTypeBreakdown] = useState<{ name: string; amount: number; percentage: number; color: string }[]>(emptyFeeTypeBreakdown);

  const fetchAll = useCallback(async () => {
    const authed = authService.isAuthenticated();
    setError(null);
    if (authed) setLoading(true);

    // Public data (grades/claims/settings endpoints allow anonymous access —
    // needed by the parent portal and the public fee modal).
    try {
      const [gradesRes, claimsRes, settingsRes] = await Promise.all([
        api.grades.list(),
        api.claims.list(),
        api.settings.list(),
      ]);
      setGrades(gradesRes.results.map(mapApiGrade));
      setClaims(claimsRes.results);
      setSettings({
        allocationOrder: settingsRes.allocationOrder?.length ? settingsRes.allocationOrder : DEFAULT_ALLOCATION_PRIORITY,
        notFoundDays: settingsRes.notFoundDays || 3,
        csvMapping: settingsRes.csvMapping || null,
      });
    } catch (e) {
      if (authed) setError(e instanceof Error ? e.message : 'Failed to load data');
    }

    if (!authed) {
      setLoading(false);
      return;
    }

    try {
      const [studentsRes, financeRes, payRes, allocs, rows, imports, audit] = await Promise.all([
        api.students.list(),
        api.finance.summary(),
        api.payments.list({ page_size: '500' }),
        api.allocations.list(),
        api.statements.rows(),
        api.statements.imports(),
        api.audit.list(),
      ]);

      setStudents(studentsRes.results.map(mapApiStudent));
      setPayments(payRes.results.map(mapApiPayment));
      setFinanceSummary({
        totalExpected: financeRes.summary.total_expected,
        totalCollected: financeRes.summary.total_collected,
        outstanding: financeRes.summary.outstanding,
        collectionRate: financeRes.summary.collection_rate,
      });
      setAllocations(allocs);
      setStatementRows(rows);
      setStatementImports(imports);
      setAuditEntries(audit);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshClaims = useCallback(async () => {
    const res = await api.claims.list();
    setClaims(res.results);
  }, []);

  const refreshStatements = useCallback(async () => {
    const [rows, imports] = await Promise.all([api.statements.rows(), api.statements.imports()]);
    setStatementRows(rows);
    setStatementImports(imports);
  }, []);

  const refreshAudit = useCallback(async () => {
    setAuditEntries(await api.audit.list());
  }, []);

  useEffect(() => {
    fetchAll();

    const onLogin = () => fetchAll();
    const onLogout = () => {
      setGrades([]); setStudents([]); setPayments([]); setAllocations([]);
      setClaims([]); setStatementRows([]); setStatementImports([]); setAuditEntries([]);
    };
    window.addEventListener('auth:login', onLogin);
    window.addEventListener('auth:logout', onLogout);
    return () => {
      window.removeEventListener('auth:login', onLogin);
      window.removeEventListener('auth:logout', onLogout);
    };
  }, [fetchAll]);

  const getGradeById = (id: string): Grade | undefined => {
    return grades.find((g) => g.id === id);
  };

  const getGradeTotalFees = (grade: Grade): number => {
    if (!grade || !grade.feeGroups) return 0;
    return grade.feeGroups.reduce((accGroup, group) => {
      const groupSum = group.items?.reduce((accItem, item) => accItem + (item.amount || 0), 0) || 0;
      return accGroup + groupSum;
    }, 0);
  };

  const getStudentById = (id: string): Student | undefined => {
    return students.find((s) => s.id === id);
  };

  const getStudentPayments = (studentId: string): Payment[] => {
    return payments
      .filter((p) => p.studentId === studentId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const getStudentTotalFees = (studentId: string): number => {
    const student = getStudentById(studentId);
    if (!student) return 0;
    const grade = getGradeById(student.gradeId);
    if (!grade) return 0;
    return getGradeTotalFees(grade);
  };

  const getStudentPaidAmount = (studentId: string): number => {
    return payments
      .filter((p) => p.studentId === studentId)
      .reduce((sum, p) => sum + (p.amount || 0), 0);
  };

  const getStudentCredit = (studentId: string): number => {
    const student = getStudentById(studentId);
    if (!student) return 0;
    const grade = getGradeById(student.gradeId);
    if (!grade) return 0;
    const studentPayments = getStudentPayments(studentId);
    const studentAllocations = allocations.filter((a) => a.studentId === studentId);
    const account = computeStudentAccount(student, grade, studentPayments, studentAllocations);
    return account.credit;
  };

  const getStudentBalance = (studentId: string): number => {
    const student = getStudentById(studentId);
    if (!student) return 0;
    const grade = getGradeById(student.gradeId);
    if (!grade) return 0;
    const studentPayments = getStudentPayments(studentId);
    const studentAllocations = allocations.filter((a) => a.studentId === studentId);
    const account = computeStudentAccount(student, grade, studentPayments, studentAllocations);
    return account.balance;
  };

  const getStudentAccount = (studentId: string): StudentAccount | null => {
    const student = getStudentById(studentId);
    if (!student) return null;
    const grade = getGradeById(student.gradeId);
    if (!grade) return null;
    const studentPayments = getStudentPayments(studentId);
    const studentAllocations = allocations.filter((a) => a.studentId === studentId);
    return computeStudentAccount(student, grade, studentPayments, studentAllocations);
  };

  const getStudentComputedStatus = (studentId: string): StudentStatus => {
    const student = getStudentById(studentId);
    if (!student) return 'Pending';
    if (student.status === 'Admitted') return 'Admitted';
    const account = getStudentAccount(studentId);
    if (!account) return 'Pending';
    if (account.totalPaid === 0) return 'Pending';
    if (account.balance > 0) return 'Partial';
    return 'Paid';
  };

  const allocationRules = (): AllocationRule[] =>
    settings.allocationOrder?.length ? settings.allocationOrder : DEFAULT_ALLOCATION_PRIORITY;

  const getAllocationBreakdown = (studentId: string) => {
    const student = getStudentById(studentId);
    if (!student) return [];
    const grade = getGradeById(student.gradeId);
    if (!grade) return [];
    const studentPayments = getStudentPayments(studentId);
    const studentAllocations = allocations.filter((a) => a.studentId === studentId && !a.reversed);
    return libGetAllocationBreakdown(student, grade, studentPayments, studentAllocations, allocationRules());
  };

  const getStudentClaims = (studentId: string): PaymentClaim[] => {
    return claims
      .filter((c) => c.studentId === studentId)
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  };

  const refreshPayments = useCallback(async () => {
    const res = await api.payments.list({ page_size: '500' });
    setPayments(res.results.map(mapApiPayment));
  }, []);

  /**
   * Run the allocation engine for one payment and persist the resulting
   * allocation rows (plus an optional audit entry) in a single bulk call.
   */
  const allocateAndPersist = async (
    payment: Payment,
    actor: string,
    existingOverride: Allocation[]
  ): Promise<Allocation[]> => {
    const student = getStudentById(payment.studentId);
    const grade = student ? getGradeById(student.gradeId) : undefined;
    if (!student || !grade) return [];
    const { allocations: newAllocs } = allocatePayment(payment, student, grade, existingOverride, allocationRules());
    if (newAllocs.length === 0) return [];
    await api.allocations.bulk({
      allocations: newAllocs.map((a) => ({
        id: a.id,
        payment: a.paymentId,
        student: a.studentId,
        fee_line_id: a.feeLineId,
        amount: a.amount,
        created_by: actor,
      })),
      performed_by: actor,
    });
    setAllocations((prev) => [...prev, ...newAllocs]);
    return newAllocs;
  };

  const submitClaim = async (claimData: {
    studentId: string; amount: number; transactionId: string; paymentDate: string;
    payerPhone: string; method?: PaymentMethod; screenshot?: string; notes?: string;
  }): Promise<PaymentClaim> => {
    const created = await api.claims.create({
      student: claimData.studentId,
      amount: claimData.amount,
      transaction_id: (claimData.transactionId || '').trim().toUpperCase(),
      payment_date: claimData.paymentDate,
      payer_phone: claimData.payerPhone,
      method: claimData.method || '',
      screenshot: claimData.screenshot || '',
      notes: claimData.notes || '',
    });
    setClaims((prev) => [created, ...prev]);
    return created;
  };

  const approveClaim = async (
    claimId: string,
    options: { reviewedBy?: string; reason?: string } = {}
  ): Promise<{ claim: PaymentClaim; payment: Payment }> => {
    const reviewedBy = options.reviewedBy || 'accountant';
    const res = await api.claims.approve(claimId, { reviewed_by: reviewedBy, reason: options.reason });
    const payment = mapApiPayment(res.payment);
    setClaims((prev) => prev.map((c) => (c.id === claimId ? res.claim : c)));
    setPayments((prev) => [payment, ...prev]);
    await allocateAndPersist(payment, reviewedBy, [...allocations]);
    await Promise.all([refreshClaims(), refreshAudit()]);
    return { claim: res.claim, payment };
  };

  const rejectClaim = async (claimId: string, reason: string, reviewedBy?: string): Promise<PaymentClaim> => {
    const updated = await api.claims.reject(claimId, { reason, reviewed_by: reviewedBy || 'accountant' });
    setClaims((prev) => prev.map((c) => (c.id === claimId ? updated : c)));
    await refreshAudit();
    return updated;
  };

  const scanNotFound = async (performedBy?: string) => {
    const res = await api.claims.scanNotFound({ days: settings.notFoundDays, performed_by: performedBy });
    await Promise.all([refreshClaims(), refreshAudit()]);
    return res;
  };

  const importStatement = async (payload: {
    fileName: string; fileHash: string; mapping: AppSettings['csvMapping'];
    uploadedBy?: string; rows: unknown[]; matches: unknown[];
  }) => {
    const res = await api.statements.import({
      file_name: payload.fileName,
      file_hash: payload.fileHash,
      mapping: payload.mapping || {},
      uploaded_by: payload.uploadedBy,
      rows: payload.rows,
      matches: payload.matches,
    });

    const createdPayments = res.payments.map(mapApiPayment);
    let acc = [...allocations];
    const toPersist: Allocation[] = [];
    for (const payment of createdPayments) {
      const student = getStudentById(payment.studentId);
      const grade = student ? getGradeById(student.gradeId) : undefined;
      if (!student || !grade) continue;
      const { allocations: newAllocs } = allocatePayment(payment, student, grade, acc, allocationRules());
      acc = [...acc, ...newAllocs];
      toPersist.push(...newAllocs);
    }
    if (toPersist.length > 0) {
      await api.allocations.bulk({
        allocations: toPersist.map((a) => ({
          id: a.id, payment: a.paymentId, student: a.studentId,
          fee_line_id: a.feeLineId, amount: a.amount, created_by: payload.uploadedBy || 'accountant',
        })),
        performed_by: payload.uploadedBy || 'accountant',
      });
      setAllocations((prev) => [...prev, ...toPersist]);
    }
    setPayments((prev) => [...createdPayments, ...prev]);
    await Promise.all([refreshClaims(), refreshStatements(), refreshAudit(), refreshPayments()]);
    return { importedRows: res.import.importedRows, skippedRows: res.import.skippedRows, payments: createdPayments };
  };

  const assignStatementRow = async (rowId: string, studentId: string, note?: string, performedBy?: string): Promise<Payment> => {
    const res = await api.statements.assignRow(rowId, {
      student_id: studentId,
      note,
      performed_by: performedBy || 'accountant',
    });
    const payment = mapApiPayment(res.payment);
    setPayments((prev) => [payment, ...prev]);
    await allocateAndPersist(payment, performedBy || 'accountant', [...allocations]);
    await Promise.all([refreshStatements(), refreshAudit()]);
    return payment;
  };

  const reallocatePayment = async (args: {
    paymentId: string; studentId: string; targetFeeLineId: string; amount: number;
    reason: string; performedBy: string;
  }) => {
    const student = getStudentById(args.studentId);
    const grade = student ? getGradeById(student.gradeId) : undefined;
    if (!student || !grade) throw new Error('Student or grade not found');

    const payment = payments.find((p) => p.id === args.paymentId);
    if (!payment) throw new Error('Payment not found');

    const studentAllocs = allocations.filter((a) => a.studentId === args.studentId && !a.reversed);
    const paymentAllocs = studentAllocs.filter((a) => a.paymentId === args.paymentId);
    const beforeTotal = paymentAllocs.reduce((s, a) => s + a.amount, 0);

    const result = libReallocatePayment(
      payment, student, grade, studentAllocs,
      args.targetFeeLineId, args.amount, args.reason, args.performedBy,
      allocationRules()
    );

    const targetLine = buildFeeLines(grade, allocationRules()).find((l) => l.id === args.targetFeeLineId);

    await api.allocations.bulk({
      allocations: result.allocations.map((a) => ({
        id: a.id, payment: a.paymentId, student: a.studentId,
        fee_line_id: a.feeLineId, fee_group_name: a.feeGroupName, fee_item_label: a.feeItemLabel,
        amount: a.amount, created_by: args.performedBy,
      })),
      reversed_ids: result.reversedIds,
      audit: {
        student: args.studentId,
        payment: args.paymentId,
        action: 'REALLOCATE',
        performed_by: args.performedBy,
        before: {
          lines: paymentAllocs.map((a) => ({ fee_line_id: a.feeLineId, amount: Number(a.amount) })),
          total: beforeTotal,
        },
        after: {
          lines: result.allocations.map((a) => ({ fee_line_id: a.feeLineId, amount: Number(a.amount) })),
          target: args.targetFeeLineId,
          target_item: targetLine?.feeItemLabel,
          moved: args.amount,
        },
        reason: args.reason,
      },
      performed_by: args.performedBy,
    });

    setAllocations((prev) => [
      ...prev.map((a) => (result.reversedIds.includes(a.id) ? { ...a, reversed: true } : a)),
      ...result.allocations,
    ]);
    await refreshAudit();
  };

  const updateSettings = async (partial: Partial<AppSettings>, performedBy?: string): Promise<void> => {
    const entries: Array<[string, unknown]> = [];
    if (partial.allocationOrder) entries.push(['allocation_order', partial.allocationOrder]);
    if (partial.notFoundDays !== undefined) entries.push(['not_found_days', partial.notFoundDays]);
    if (partial.csvMapping !== undefined) entries.push(['csv_mapping', partial.csvMapping]);
    for (const [key, value] of entries) {
      await api.settings.update(key, value);
    }
    setSettings((prev) => ({ ...prev, ...partial }));
    await refreshAudit();
    void performedBy;
  };

  const logAudit = async (entry: {
    studentId?: string; paymentId?: string; action: AuditAction; performedBy: string;
    reason?: string; before?: Record<string, unknown>; after?: Record<string, unknown>;
  }) => {
    await api.audit.create({
      student: entry.studentId || null,
      payment: entry.paymentId || null,
      action: entry.action,
      performed_by: entry.performedBy,
      reason: entry.reason || '',
      before: entry.before || {},
      after: entry.after || {},
    });
    await refreshAudit();
  };

  const addStudent = async (
    data: Omit<Student, 'id' | 'applicationNo' | 'status' | 'createdAt'> & { status?: StudentStatus }
  ): Promise<Student> => {
    const apiData: Record<string, unknown> = {
      first_name: data.firstName,
      middle_name: data.middleName,
      last_name: data.lastName,
      gender: data.gender,
      dob: data.dob,
      address: data.address,
      parent_name: data.parentName,
      parent_phone: data.parentPhone,
      parent_address: data.parentAddress,
      parent_relationship: data.parentRelationship,
      parent_national_id: data.parentNationalId,
      emergency_contact_name: data.emergencyContactName,
      emergency_contact_phone: data.emergencyContactPhone,
      emergency_contact_relationship: data.emergencyContactRelationship,
      grade_id: data.gradeId,
      academic_year: data.academicYear,
      previous_school: data.previousSchool,
      additional_info: data.additionalInfo,
    };
    if (data.photo) apiData.photo = data.photo;
    const created = await api.students.create(apiData);
    const mapped = mapApiStudent(created);
    setStudents((prev) => [mapped, ...prev]);
    await fetchAll();
    return mapped;
  };

  const updateStudent = async (id: string, data: Partial<Student>): Promise<void> => {
    const apiData: Record<string, unknown> = {};
    if (data.firstName !== undefined) apiData.first_name = data.firstName;
    if (data.middleName !== undefined) apiData.middle_name = data.middleName;
    if (data.lastName !== undefined) apiData.last_name = data.lastName;
    if (data.gender !== undefined) apiData.gender = data.gender;
    if (data.dob !== undefined) apiData.dob = data.dob;
    if (data.address !== undefined) apiData.address = data.address;
    if (data.parentName !== undefined) apiData.parent_name = data.parentName;
    if (data.parentPhone !== undefined) apiData.parent_phone = data.parentPhone;
    if (data.parentAddress !== undefined) apiData.parent_address = data.parentAddress;
    if (data.parentRelationship !== undefined) apiData.parent_relationship = data.parentRelationship;
    if (data.parentNationalId !== undefined) apiData.parent_national_id = data.parentNationalId;
    if (data.emergencyContactName !== undefined) apiData.emergency_contact_name = data.emergencyContactName;
    if (data.emergencyContactPhone !== undefined) apiData.emergency_contact_phone = data.emergencyContactPhone;
    if (data.emergencyContactRelationship !== undefined) apiData.emergency_contact_relationship = data.emergencyContactRelationship;
    if (data.gradeId !== undefined) apiData.grade_id = data.gradeId;
    if (data.academicYear !== undefined) apiData.academic_year = data.academicYear;
    if (data.previousSchool !== undefined) apiData.previous_school = data.previousSchool;
    if (data.additionalInfo !== undefined) apiData.additional_info = data.additionalInfo;
    if (data.notes !== undefined) apiData.notes = data.notes;
    if (data.status !== undefined) apiData.status = data.status;
    if (data.photo !== undefined) apiData.photo = data.photo;

    await api.students.update(id, apiData);
    await fetchAll();
  };

  const updateStudentStatus = async (id: string, status: StudentStatus): Promise<void> => {
    await api.students.updateStatus(id, status);
    await fetchAll();
  };

  const deleteStudent = async (id: string): Promise<void> => {
    await api.students.delete(id);
    setStudents((prev) => prev.filter((s) => s.id !== id));
    setPayments((prev) => prev.filter((p) => p.studentId !== id));
    setAllocations((prev) => prev.filter((a) => a.studentId !== id));
    setClaims((prev) => prev.filter((c) => c.studentId !== id));
  };

  const refreshFinance = useCallback(async () => {
    const financeRes = await api.finance.summary();
    setFinanceSummary({
      totalExpected: financeRes.summary.total_expected,
      totalCollected: financeRes.summary.total_collected,
      outstanding: financeRes.summary.outstanding,
      collectionRate: financeRes.summary.collection_rate,
    });
  }, []);

  const addPayment = async (paymentData: Omit<Payment, 'id'>): Promise<Payment> => {
    if (hasDuplicateTransactionId(payments, paymentData.reference)) {
      throw new Error(`Transaction ID "${paymentData.reference}" already exists.`);
    }

    const apiData = {
      student: paymentData.studentId,
      amount: paymentData.amount,
      method: paymentData.method,
      date: paymentData.date,
      reference: paymentData.reference,
      notes: paymentData.notes,
    };
    const created = await api.payments.create(apiData);
    const mapped = mapApiPayment(created);

    const student = getStudentById(paymentData.studentId);
    const grade = student ? getGradeById(student.gradeId) : undefined;
    if (student && grade) {
      const studentAllocations = allocations.filter((a) => a.studentId === student.id && !a.reversed);
      const { allocations: newAllocations } = allocatePayment(mapped, student, grade, studentAllocations, allocationRules());
      if (newAllocations.length > 0) {
        await api.allocations.bulk({
          allocations: newAllocations.map((a) => ({
            id: a.id, payment: a.paymentId, student: a.studentId,
            fee_line_id: a.feeLineId, amount: a.amount, created_by: 'accountant',
          })),
          audit: {
            student: student.id,
            payment: mapped.id,
            action: 'PAYMENT_CREATE',
            performed_by: 'accountant',
            after: { amount: mapped.amount, reference: mapped.reference, method: mapped.method },
            reason: `Payment recorded (${mapped.method})`,
          },
          performed_by: 'accountant',
        });
        setAllocations((prev) => [...prev, ...newAllocations]);
      } else {
        await logAudit({
          studentId: student.id, paymentId: mapped.id, action: 'PAYMENT_CREATE',
          performedBy: 'accountant', after: { amount: mapped.amount, reference: mapped.reference },
          reason: `Payment recorded (${mapped.method})`,
        });
      }
    }

    setPayments((prev) => [mapped, ...prev]);
    await Promise.all([refreshFinance(), refreshAudit()]);
    return mapped;
  };

  const addGrade = async (gradeData: Omit<Grade, 'id'>): Promise<Grade> => {
    const apiData = {
      id: `grade-${Date.now()}`,
      name: gradeData.name,
      description: gradeData.description,
      age_range: gradeData.ageRange,
      fee_groups: gradeData.feeGroups.map(fg => ({
        id: fg.id,
        name: fg.name,
        items: fg.items.map(i => ({ id: i.id, label: i.label, amount: i.amount }))
      }))
    };
    const created = await api.grades.create(apiData);
    const mapped = mapApiGrade(created);
    setGrades((prev) => [...prev, mapped]);
    return mapped;
  };

  const updateGrade = async (id: string, data: Partial<Grade>): Promise<void> => {
    const apiData: Record<string, unknown> = {};
    if (data.name !== undefined) apiData.name = data.name;
    if (data.description !== undefined) apiData.description = data.description;
    if (data.ageRange !== undefined) apiData.age_range = data.ageRange;
    if (data.feeGroups !== undefined) {
      apiData.fee_groups = data.feeGroups.map(fg => ({
        id: fg.id,
        name: fg.name,
        items: fg.items.map(i => ({ id: i.id, label: i.label, amount: i.amount }))
      }));
    }
    await api.grades.update(id, apiData);
    await fetchAll();
  };

  const deleteGrade = async (id: string): Promise<void> => {
    console.log('[AppContext] deleteGrade called', { id });
    const grade = grades.find(g => g.id === id);
    const enrolledStudents = students.filter(s => s.gradeId === id);
    console.log('[AppContext] grade found:', grade);
    console.log('[AppContext] enrolledStudents:', enrolledStudents.length);
    
    if (enrolledStudents.length > 0) {
      const errMsg = `Cannot delete ${grade?.name || 'grade'}: ${enrolledStudents.length} student(s) are enrolled. Please reassign or remove them first.`;
      console.log('[AppContext] throwing error:', errMsg);
      throw new Error(errMsg);
    }
    
    console.log('[AppContext] calling api.grades.delete...');
    await api.grades.delete(id);
    console.log('[AppContext] api.grades.delete done, updating state');
    setGrades((prev) => prev.filter((g) => g.id !== id));
  };

  const refetch = fetchAll;

  return (
    <AppContext.Provider
      value={{
        grades,
        students,
        payments,
        allocations,
        claims,
        statementRows,
        statementImports,
        auditEntries,
        settings,
        loading,
        error,
        addStudent,
        updateStudent,
        updateStudentStatus,
        deleteStudent,
        addPayment,
        addGrade,
        updateGrade,
        deleteGrade,
        getGradeById,
        getGradeTotalFees,
        getStudentById,
        getStudentPayments,
        getStudentTotalFees,
        getStudentPaidAmount,
        getStudentBalance,
        getStudentCredit,
        getStudentAccount,
        getStudentComputedStatus,
        getAllocationBreakdown,
        getStudentClaims,
        submitClaim,
        approveClaim,
        rejectClaim,
        scanNotFound,
        refreshClaims,
        importStatement,
        assignStatementRow,
        refreshStatements,
        reallocatePayment,
        updateSettings,
        refreshAudit,
        logAudit,
        financeSummary,
        monthlyCollections,
        feeTypeBreakdown,
        refetch,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};