export type Gender = 'Male' | 'Female';

export type StudentStatus = 'Pending' | 'Paid' | 'Admitted';

export type PaymentMethod = 'M-Pesa' | 'Mixx by Yas' | 'Airtel Money' | 'Bank';

export interface FeeItem {
  id: string;
  label: string;
  amount: number;
}

export interface FeeGroup {
  id: string;
  name: string; // e.g. "SCHOOL FEE", "TRANSPORT FEE", "ADMISSION FEE"
  items: FeeItem[];
}

export interface Grade {
  id: string;
  name: string; // e.g. "Grade 1", "Grade 2", "Grade 3"
  description?: string;
  ageRange?: string;
  feeGroups: FeeGroup[];
}

export interface Student {
  id: string;
  applicationNo: string; // e.g. "BFS-2026-001"
  firstName: string;
  middleName?: string;
  lastName: string;
  gender: Gender;
  dob: string;
  address: string;
  parentName: string;
  parentPhone: string;
  parentAddress: string;
  gradeId: string;
  academicYear: string;
  previousSchool?: string;
  /** Optional free-text description. May be written by the applicant on the public form or by staff. */
  additionalInfo?: string;
  notes?: string;
  status: StudentStatus;
  createdAt: string;
}

export interface Payment {
  id: string;
  studentId: string;
  amount: number;
  method: PaymentMethod;
  date: string;
  reference: string;
  notes?: string;
}

export interface FinanceSummary {
  totalExpected: number;
  totalCollected: number;
  outstanding: number;
  collectionRate: number;
}
