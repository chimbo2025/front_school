import { authenticatedFetch } from './auth';
import {
  AppSettings, AuditEntry, CsvMapping, ParentSummary, PaymentClaim,
  StatementImport, StatementRow, Allocation as DomainAllocation,
} from '../types';

export class ApiError extends Error {
  status: number;
  payload: Record<string, unknown>;
  constructor(message: string, status: number, payload: Record<string, unknown>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

function formatApiError(payload: unknown, res: Response): string {
  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    const obj = payload as Record<string, unknown>;
    const direct = [obj.detail, obj.message, obj.error].find(
      (v) => typeof v === 'string' && v
    );
    if (direct) return direct as string;

    // DRF field validation errors: { field: ["message", ...] }
    const parts: string[] = [];
    for (const [field, value] of Object.entries(obj)) {
      const messages = Array.isArray(value) ? value : [value];
      for (const m of messages) {
        if (typeof m === 'string' && m) {
          parts.push(`${field}: ${m}`);
        } else if (
          m &&
          typeof m === 'object' &&
          'message' in m &&
          typeof (m as { message: unknown }).message === 'string'
        ) {
          parts.push(`${field}: ${(m as { message: string }).message}`);
        }
      }
    }
    if (parts.length) return parts.join('\n');
  } else if (typeof payload === 'string' && payload) {
    return payload;
  }

  return res.statusText || 'Request failed';
}

async function fetchJson<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await authenticatedFetch(url, options);

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));

    throw new ApiError(formatApiError(err, res), res.status, err);
  }

  if (res.status === 204) {
    return undefined as T;
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
export type StudentStatus = 'Pending' | 'Partial' | 'Paid' | 'Admitted';
export type PaymentMethod = 'M-Pesa' | 'Mixx by Yas' | 'Airtel Money' | 'Bank' | 'Lipa Namba';
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
  /** Optional passport photo URL */
  photo?: string;
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
  source?: 'MANUAL' | 'CLAIM' | 'PROVIDER';
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
    create: (data: Record<string, unknown>) => fetchJson<Grade>('/grades/', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Record<string, unknown>) => fetchJson<Grade>(`/grades/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => {
      console.log('[API] grades.delete called', { id, url: `/grades/${id}/` });
      return fetchJson<void>(`/grades/${id}/`, { method: 'DELETE' });
    },
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

  claims: {
    list: async (params?: Record<string, string>) => {
      const p = { page_size: '500', ...(params || {}) };
      const res = await fetchJson<{ results: ApiClaim[]; count: number }>(`/claims/?${new URLSearchParams(p)}`);
      return { results: res.results.map(mapClaim), count: res.count };
    },
    create: async (data: Record<string, unknown>) => mapClaim(await fetchJson<ApiClaim>('/claims/', { method: 'POST', body: JSON.stringify(data) })),
    approve: async (id: string, data: { reviewed_by?: string; reason?: string }) => {
      const res = await fetchJson<{ claim: ApiClaim; payment: Payment }>(`/claims/${id}/approve/`, { method: 'POST', body: JSON.stringify(data) });
      return { claim: mapClaim(res.claim), payment: res.payment };
    },
    reject: async (id: string, data: { reason: string; reviewed_by?: string }) =>
      mapClaim(await fetchJson<ApiClaim>(`/claims/${id}/reject/`, { method: 'POST', body: JSON.stringify(data) })),
    scanNotFound: (data: { days?: number; performed_by?: string }) =>
      fetchJson<{ not_found: string[]; restored: string[]; days: number }>('/claims/scan_not_found/', { method: 'POST', body: JSON.stringify(data) }),
    parents: () => fetchJson<ParentSummary[]>('/claims/parents/'),
  },

  statements: {
    imports: async () => (await fetchJson<ApiStatementImport[]>('/statements/?page_size=100')).map(mapStatementImport),
    rows: async (status?: string) =>
      (await fetchJson<ApiStatementRow[]>(`/statements/?resource=rows${status ? `&status=${status}` : ''}`)).map(mapStatementRow),
    txnIds: () => fetchJson<string[]>('/statements/txn_ids/'),
    import: async (data: {
      file_name: string; file_hash: string; mapping: CsvMapping;
      uploaded_by?: string; rows: unknown[]; matches: unknown[];
    }) => {
      const res = await fetchJson<{ import: ApiStatementImport; rows: ApiStatementRow[]; payments: Payment[] }>('/statements/imports/', { method: 'POST', body: JSON.stringify(data) });
      return { import: mapStatementImport(res.import), rows: res.rows.map(mapStatementRow), payments: res.payments };
    },
    assignRow: async (id: string, data: { student_id: string; note?: string; performed_by?: string; method?: string }) => {
      const res = await fetchJson<{ row: ApiStatementRow; payment: Payment }>(`/statements/${id}/assign_row/`, { method: 'POST', body: JSON.stringify(data) });
      return { row: mapStatementRow(res.row), payment: res.payment };
    },
  },

  allocations: {
    list: async (params?: Record<string, string>) => {
      const qs = params ? `?${new URLSearchParams(params).toString()}` : '';
      const rows = await fetchJson<ApiAllocation[]>(`/allocations/${qs}`);
      return rows.map(mapAllocation);
    },
    bulk: (data: {
      allocations: Array<Partial<DomainAllocation> & { payment: string; student: string; fee_line_id: string; amount: number }>;
      reversed_ids?: string[];
      audit?: Record<string, unknown>;
      performed_by?: string;
    }) => fetchJson<ApiAllocation[]>('/allocations/bulk/', { method: 'POST', body: JSON.stringify(data) }),
  },

  audit: {
    list: async (params?: Record<string, string>) => {
      const qs = params ? `?${new URLSearchParams(params).toString()}` : '';
      const rows = await fetchJson<ApiAuditLog[]>(`/audit/${qs}`);
      return rows.map(mapAudit);
    },
    create: (data: Record<string, unknown>) => fetchJson<ApiAuditLog>('/audit/', { method: 'POST', body: JSON.stringify(data) }),
  },

  settings: {
    list: async () => {
      const rows = await fetchJson<Array<{ key: string; value: unknown }>>('/settings/');
      const map = new Map(rows.map((r) => [r.key, r.value]));
      return {
        allocationOrder: (map.get('allocation_order') as AppSettings['allocationOrder']) || [],
        notFoundDays: (map.get('not_found_days') as number) || 3,
        csvMapping: (map.get('csv_mapping') as CsvMapping) || null,
      } satisfies AppSettings;
    },
    update: (key: string, value: unknown) =>
      fetchJson<Array<{ key: string; value: unknown }>>(`/settings/${key}/`, { method: 'PUT', body: JSON.stringify({ value }) }),
  },
};

// ---------------------------------------------------------------------------
// API (snake_case) → domain (camelCase) mappers
// ---------------------------------------------------------------------------

export interface ApiClaim {
  id: string;
  student: string;
  student_name: string;
  grade_name: string;
  amount: string | number;
  transaction_id: string;
  payment_date: string;
  payer_phone: string;
  method: string;
  screenshot?: string | null;
  notes?: string | null;
  status: string;
  match_reason: string;
  submitted_at: string;
  reviewed_at?: string | null;
  reviewed_by?: string;
  rejection_reason?: string;
  matched_payment?: string | null;
}

export interface ApiStatementRow {
  id: string;
  import_record: string;
  transaction_id: string;
  date: string;
  amount: string | number;
  sender_phone: string;
  sender_name: string;
  receiver_till: string;
  direction: 'IN' | 'OUT';
  status: string;
  claim?: string | null;
  claim_status?: string | null;
  student?: string | null;
  student_name?: string | null;
  match_type?: string;
  match_reason?: string;
}

export interface ApiStatementImport {
  id: string;
  file_name: string;
  file_hash: string;
  mapping: CsvMapping;
  uploaded_at: string;
  uploaded_by: string;
  total_rows: number;
  imported_rows: number;
  skipped_rows: number;
  matched_claims: number;
  status: string;
}

export interface ApiAllocation {
  id: string;
  payment: string;
  student: string;
  fee_line_id: string;
  fee_group_name: string;
  fee_item_label: string;
  amount: string | number;
  reversed: boolean;
  created_at: string;
  created_by: string;
}

export interface ApiAuditLog {
  id: string;
  student?: string | null;
  student_name?: string | null;
  payment?: string | null;
  action: string;
  performed_by: string;
  performed_at: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  reason?: string;
}

const num = (v: string | number): number => (typeof v === 'number' ? v : parseFloat(v) || 0);

export function mapClaim(c: ApiClaim): PaymentClaim {
  return {
    id: c.id,
    studentId: c.student,
    studentName: c.student_name,
    gradeName: c.grade_name,
    amount: num(c.amount),
    transactionId: c.transaction_id || '',
    paymentDate: c.payment_date,
    payerPhone: c.payer_phone,
    method: (c.method || '') as PaymentClaim['method'],
    screenshot: c.screenshot || undefined,
    notes: c.notes || undefined,
    status: c.status as PaymentClaim['status'],
    matchReason: c.match_reason || '',
    submittedAt: c.submitted_at,
    reviewedAt: c.reviewed_at || undefined,
    reviewedBy: c.reviewed_by || undefined,
    rejectionReason: c.rejection_reason || '',
    matchedPaymentId: c.matched_payment || undefined,
  };
}

export function mapStatementRow(r: ApiStatementRow): StatementRow {
  return {
    id: r.id,
    importId: r.import_record,
    transactionId: r.transaction_id,
    date: r.date,
    amount: num(r.amount),
    senderPhone: r.sender_phone,
    senderName: r.sender_name,
    receiverTill: r.receiver_till,
    direction: r.direction,
    status: r.status as StatementRow['status'],
    claimId: r.claim || null,
    claimStatus: (r.claim_status as StatementRow['claimStatus']) || null,
    studentId: r.student || null,
    studentName: r.student_name || null,
    matchType: r.match_type,
    matchReason: r.match_reason,
  };
}

export function mapStatementImport(i: ApiStatementImport): StatementImport {
  return {
    id: i.id,
    fileName: i.file_name,
    fileHash: i.file_hash,
    mapping: i.mapping || {},
    uploadedAt: i.uploaded_at,
    uploadedBy: i.uploaded_by,
    totalRows: i.total_rows,
    importedRows: i.imported_rows,
    skippedRows: i.skipped_rows,
    matchedClaims: i.matched_claims,
    status: i.status === 'FAILED' ? 'FAILED' : 'COMPLETED',
  };
}

function mapAllocation(a: ApiAllocation): DomainAllocation {
  return {
    id: a.id,
    paymentId: a.payment,
    studentId: a.student,
    feeLineId: a.fee_line_id,
    amount: num(a.amount),
    feeGroupName: a.fee_group_name,
    feeItemLabel: a.fee_item_label,
    reversed: a.reversed,
    createdAt: a.created_at,
    createdBy: a.created_by,
  };
}

function mapAudit(a: ApiAuditLog): AuditEntry {
  return {
    id: a.id,
    studentId: a.student || null,
    studentName: a.student_name || null,
    paymentId: a.payment || null,
    action: a.action as AuditEntry['action'],
    performedBy: a.performed_by,
    performedAt: a.performed_at,
    before: a.before,
    after: a.after,
    reason: a.reason,
  };
}