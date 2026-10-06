import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Grade, Student, Payment, StudentStatus, PaymentMethod, FinanceSummary, Relationship, FeeItem, FeeGroup } from '../types';
import { api, Grade as ApiGrade, Student as ApiStudent, StudentListItem, Payment as ApiPayment } from '../services/api';

interface AppContextType {
  grades: Grade[];
  students: Student[];
  payments: Payment[];
  loading: boolean;
  error: string | null;
  addStudent: (student: Omit<Student, 'id' | 'applicationNo' | 'status' | 'createdAt'> & { status?: StudentStatus }) => Promise<Student>;
  updateStudent: (id: string, data: Partial<Student>) => Promise<void>;
  updateStudentStatus: (id: string, status: StudentStatus) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;
  addPayment: (payment: Omit<Payment, 'id'>) => Promise<Payment>;
  addGrade: (grade: Omit<Grade, 'id'>) => Promise<Grade>;
  updateGrade: (id: string, data: Partial<Grade>) => Promise<void>;
  getGradeById: (id: string) => Grade | undefined;
  getGradeTotalFees: (grade: Grade) => number;
  getStudentById: (id: string) => Student | undefined;
  getStudentPayments: (studentId: string) => Payment[];
  getStudentTotalFees: (studentId: string) => number;
  getStudentPaidAmount: (studentId: string) => number;
  getStudentBalance: (studentId: string) => number;
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
    feeGroups: g.fee_groups.map(fg => ({
      id: fg.id,
      name: fg.name,
      items: fg.items.map(i => ({ id: i.id, label: i.label, amount: i.amount }))
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
    setLoading(true);
    setError(null);
    try {
      const [gradesRes, studentsRes, financeRes] = await Promise.all([
        api.grades.list(),
        api.students.list(),
        api.finance.summary(),
      ]);

      setGrades(gradesRes.results.map(mapApiGrade));
      setStudents(studentsRes.results.map(mapApiStudent));
      setFinanceSummary({
        totalExpected: financeRes.summary.total_expected,
        totalCollected: financeRes.summary.total_collected,
        outstanding: financeRes.summary.outstanding,
        collectionRate: financeRes.summary.collection_rate,
      });
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
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

  const getStudentBalance = (studentId: string): number => {
    const total = getStudentTotalFees(studentId);
    const paid = getStudentPaidAmount(studentId);
    return Math.max(0, total - paid);
  };

  const addStudent = async (
    data: Omit<Student, 'id' | 'applicationNo' | 'status' | 'createdAt'> & { status?: StudentStatus }
  ): Promise<Student> => {
    const apiData = {
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
  };

  const addPayment = async (paymentData: Omit<Payment, 'id'>): Promise<Payment> => {
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
    setPayments((prev) => [mapped, ...prev]);
    await fetchAll();
    return mapped;
  };

  const addGrade = async (gradeData: Omit<Grade, 'id'>): Promise<Grade> => {
    const apiData = {
      id: `grade-${Date.now()}`,
      name: gradeData.name,
      description: gradeData.description,
      age_range: gradeData.ageRange,
    };
    // Note: Backend doesn't have a create endpoint for grades (ReadOnlyModelViewSet)
    // This would need a backend change. For now, throw error.
    throw new Error('Grade creation not supported via API yet. Use Django admin.');
  };

  const updateGrade = async (id: string, data: Partial<Grade>): Promise<void> => {
    // Note: Backend doesn't have update endpoint for grades (ReadOnlyModelViewSet)
    throw new Error('Grade update not supported via API yet. Use Django admin.');
  };

  const refetch = fetchAll;

  return (
    <AppContext.Provider
      value={{
        grades,
        students,
        payments,
        loading,
        error,
        addStudent,
        updateStudent,
        updateStudentStatus,
        deleteStudent,
        addPayment,
        addGrade,
        updateGrade,
        getGradeById,
        getGradeTotalFees,
        getStudentById,
        getStudentPayments,
        getStudentTotalFees,
        getStudentPaidAmount,
        getStudentBalance,
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