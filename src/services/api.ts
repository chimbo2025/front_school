import { authService } from './auth';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const authHeader = authService.getAuthHeader();
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json', ...authHeader, ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || res.statusText || 'Request failed');
  }
  return res.json();
}

export interface FeeItem {
  id: string;
  label: string;
  amount: number;
}

export interface FeeGroup {
  id: string;
  name: string;
  items: FeeItem[];
}

export interface Grade {
  id: string;
  name: string;
  description?: string;
  age_range?: string;
  fee_groups: FeeGroup[];
  total_fee: number;
}

export type Gender = 'Male' | 'Female';
export type StudentStatus = 'Pending' | 'Paid' | 'Admitted';
export type PaymentMethod = 'M-Pesa' | 'Mixx by Yas' | 'Airtel Money' | 'Bank';
export type Relationship = 'Father' | 'Mother' | 'Guardian' | 'Grandparent' | 'Sibling' | 'Other';

export interface Student {
  id: string;
  application_no: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  gender: Gender;
  dob: string;
  address: string;
  parent_name: string;
  parent_phone: string;
  parent_address: string;
  parent_relationship: Relationship;
  parent_national_id: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relationship: Relationship;
  grade: Grade;
  grade_id: string;
  academic_year: string;
  previous_school?: string;
  additional_info?: string;
  notes?: string;
  status: StudentStatus;
  expected_fees: number;
  total_paid: number;
  outstanding: number;
  payments: Payment[];
  created_at: string;
  updated_at: string;
}

export interface StudentListItem {
  id: string;
  application_no: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  gender: Gender;
  dob: string;
  address: string;
  parent_name: string;
  parent_phone: string;
  parent_relationship: Relationship;
  parent_national_id: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relationship: Relationship;
  grade: string;
  grade_name: string;
  academic_year: string;
  status: StudentStatus;
  expected_fees: number;
  total_paid: number;
  outstanding: number;
  created_at: string;
}

export interface Payment {
  id: string;
  student: string;
  amount: number;
  method: PaymentMethod;
  date: string;
  reference: string;
  notes?: string;
  created_at: string;
}

export interface FinanceSummary {
  total_expected: number;
  total_collected: number;
  outstanding: number;
  collection_rate: number;
}

export interface StudentStats {
  total_students: number;
  by_status: { pending: number; paid: number; admitted: number };
  by_grade: Array<{
    grade_id: string;
    grade_name: string;
    student_count: number;
    total_expected: number;
    total_collected: number;
    outstanding: number;
  }>;
}

export const api = {
  grades: {
    list: () => fetchJson<{ results: Grade[]; count: number }>('/grades/'),
    get: (id: string) => fetchJson<Grade>(`/grades/${id}/`),
  },
  students: {
    list: (params?: Record<string, string>) => {
      const qs = params ? `?${new URLSearchParams(params).toString()}` : '';
      return fetchJson<{ results: StudentListItem[]; count: number }>(`/students/${qs}`);
    },
    get: (id: string) => fetchJson<Student>(`/students/${id}/`),
    create: (data: Partial<Student>) => fetchJson<Student>('/students/', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Student>) => fetchJson<Student>(`/students/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => fetchJson<void>(`/students/${id}/`, { method: 'DELETE' }),
    updateStatus: (id: string, status: StudentStatus) => fetchJson<Student>(`/students/${id}/update_status/`, { method: 'POST', body: JSON.stringify({ status }) }),
    addPayment: (id: string, data: Omit<Payment, 'id' | 'student' | 'created_at'>) => fetchJson<Student>(`/students/${id}/add_payment/`, { method: 'POST', body: JSON.stringify(data) }),
    stats: () => fetchJson<StudentStats>('/students/stats/'),
  },
  payments: {
    list: (params?: Record<string, string>) => {
      const qs = params ? `?${new URLSearchParams(params).toString()}` : '';
      return fetchJson<{ results: Payment[]; count: number }>(`/payments/${qs}`);
    },
    create: (data: Omit<Payment, 'id' | 'created_at'>) => fetchJson<Payment>('/payments/', { method: 'POST', body: JSON.stringify(data) }),
  },
  finance: {
    summary: () => fetchJson<{ summary: FinanceSummary; by_method: Array<{ method: string; total: number; count: number }>; by_grade: Array<{ grade: string; expected: number; collected: number; outstanding: number }> }>('/finance/summary/'),
  },
};