import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Grade, Student, Payment, StudentStatus, PaymentMethod, FinanceSummary } from '../types';
import { initialGrades, initialStudents, initialPayments } from '../data/sampleData';

interface AppContextType {
  grades: Grade[];
  students: Student[];
  payments: Payment[];
  addStudent: (student: Omit<Student, 'id' | 'applicationNo' | 'status' | 'createdAt'> & { status?: StudentStatus }) => Student;
  updateStudent: (id: string, data: Partial<Student>) => void;
  updateStudentStatus: (id: string, status: StudentStatus) => void;
  deleteStudent: (id: string) => void;
  addPayment: (payment: Omit<Payment, 'id'>) => Payment;
  addGrade: (grade: Omit<Grade, 'id'>) => Grade;
  updateGrade: (id: string, data: Partial<Grade>) => void;
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
  resetToSampleData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  GRADES: 'schoolportal_grades_v1',
  STUDENTS: 'schoolportal_students_v1',
  PAYMENTS: 'schoolportal_payments_v1',
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [grades, setGrades] = useState<Grade[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.GRADES);
      return saved ? JSON.parse(saved) : initialGrades;
    } catch {
      return initialGrades;
    }
  });

  const [students, setStudents] = useState<Student[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.STUDENTS);
      return saved ? JSON.parse(saved) : initialStudents;
    } catch {
      return initialStudents;
    }
  });

  const [payments, setPayments] = useState<Payment[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PAYMENTS);
      return saved ? JSON.parse(saved) : initialPayments;
    } catch {
      return initialPayments;
    }
  });

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.GRADES, JSON.stringify(grades));
    } catch (e) {
      console.warn('Failed to save grades to localStorage', e);
    }
  }, [grades]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    } catch (e) {
      console.warn('Failed to save students to localStorage', e);
    }
  }, [students]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(payments));
    } catch (e) {
      console.warn('Failed to save payments to localStorage', e);
    }
  }, [payments]);

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

  const addStudent = (
    data: Omit<Student, 'id' | 'applicationNo' | 'status' | 'createdAt'> & { status?: StudentStatus }
  ): Student => {
    const newId = `stu-${Date.now()}`;
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const applicationNo = `BFS-2026-${randomSuffix}`;
    const newStudent: Student = {
      ...data,
      id: newId,
      applicationNo,
      status: data.status || 'Pending',
      createdAt: new Date().toISOString(),
    };
    setStudents((prev) => [newStudent, ...prev]);
    return newStudent;
  };

  const updateStudent = (id: string, data: Partial<Student>) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...data } : s))
    );
  };

  const updateStudentStatus = (id: string, status: StudentStatus) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status } : s))
    );
  };

  const deleteStudent = (id: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== id));
    setPayments((prev) => prev.filter((p) => p.studentId !== id));
  };

  const addPayment = (paymentData: Omit<Payment, 'id'>): Payment => {
    const newPayment: Payment = {
      ...paymentData,
      id: `pay-${Date.now()}`,
    };
    setPayments((prev) => [newPayment, ...prev]);

    // Check if student status should be updated
    const student = getStudentById(paymentData.studentId);
    if (student) {
      const currentPaid = getStudentPaidAmount(paymentData.studentId) + paymentData.amount;
      const totalRequired = getStudentTotalFees(paymentData.studentId);

      if (student.status === 'Pending') {
        if (currentPaid >= totalRequired) {
          updateStudentStatus(student.id, 'Admitted');
        } else {
          updateStudentStatus(student.id, 'Paid');
        }
      } else if (student.status === 'Paid' && currentPaid >= totalRequired) {
        updateStudentStatus(student.id, 'Admitted');
      }
    }

    return newPayment;
  };

  const addGrade = (gradeData: Omit<Grade, 'id'>): Grade => {
    const newGrade: Grade = {
      ...gradeData,
      id: `grade-${Date.now()}`,
    };
    setGrades((prev) => [...prev, newGrade]);
    return newGrade;
  };

  const updateGrade = (id: string, data: Partial<Grade>) => {
    setGrades((prev) =>
      prev.map((g) => (g.id === id ? { ...g, ...data } : g))
    );
  };

  const resetToSampleData = () => {
    setGrades(initialGrades);
    setStudents(initialStudents);
    setPayments(initialPayments);
    localStorage.removeItem(STORAGE_KEYS.GRADES);
    localStorage.removeItem(STORAGE_KEYS.STUDENTS);
    localStorage.removeItem(STORAGE_KEYS.PAYMENTS);
  };

  // Financial calculations
  const totalExpected = students.reduce((sum, stu) => {
    const grade = getGradeById(stu.gradeId);
    return sum + (grade ? getGradeTotalFees(grade) : 0);
  }, 0);

  const totalCollected = payments.reduce((sum, pay) => sum + (pay.amount || 0), 0);
  const outstanding = Math.max(0, totalExpected - totalCollected);
  const collectionRate = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0;

  const financeSummary: FinanceSummary = {
    totalExpected,
    totalCollected,
    outstanding,
    collectionRate,
  };

  // Monthly breakdown for current academic session
  const monthlyCollections = [
    { month: 'Oct 25', amount: 1450000 },
    { month: 'Nov 25', amount: 2300000 },
    { month: 'Dec 25', amount: 3100000 },
    { month: 'Jan 26', amount: 8250000 },
    { month: 'Feb 26', amount: 4850000 },
    { month: 'Mar 26', amount: 1950000 },
  ];

  // Fee-type breakdown
  const feeTypeBreakdown = [
    { name: 'School Tuition Fee', amount: Math.round(totalCollected * 0.65), percentage: 65, color: '#16a34a' },
    { name: 'Transport Bus Fee', amount: Math.round(totalCollected * 0.25), percentage: 25, color: '#2563eb' },
    { name: 'Admission & Kit Fee', amount: Math.round(totalCollected * 0.10), percentage: 10, color: '#7c3aed' },
  ];

  return (
    <AppContext.Provider
      value={{
        grades,
        students,
        payments,
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
        resetToSampleData,
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
