export type Gender = 'Male' | 'Female';

export type StudentStatus = 'Pending' | 'Partial' | 'Paid' | 'Admitted';

export type PaymentMethod = 'M-Pesa' | 'Mixx by Yas' | 'Airtel Money' | 'Bank' | 'Lipa Namba';

export type AllocationPriority = 'ADMISSION_FEE' | 'SCHOOL_FEE' | 'TRANSPORT_FEE' | 'OTHER_FEE';

export interface FeeItem {
  id: string;
  label: string;
  amount: number;
}

export interface FeeGroup {
  id: string;
  name: string;
  items: FeeItem[];
  priority?: number;
}

export interface Grade {
  id: string;
  name: string;
  description?: string;
  ageRange?: string;
  feeGroups: FeeGroup[];
}

export type Relationship = 'Father' | 'Mother' | 'Guardian' | 'Grandparent' | 'Sibling' | 'Other';

export interface Student {
  id: string;
  applicationNo: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  gender: Gender;
  dob: string;
  address: string;
  parentName: string;
  parentPhone: string;
  parentAddress: string;
  parentRelationship: Relationship;
  parentNationalId: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelationship: Relationship;
  gradeId: string;
  academicYear: string;
  previousSchool?: string;
  additionalInfo?: string;
  notes?: string;
  status: StudentStatus;
  createdAt: string;
  photo?: string;
}

export interface Payment {
  id: string;
  studentId: string;
  amount: number;
  method: PaymentMethod;
  date: string;
  reference: string;
  notes?: string;
  source?: PaymentSource;
  createdAt?: string;
}

export type PaymentSource = 'MANUAL' | 'CLAIM' | 'PROVIDER';

export interface FinanceSummary {
  totalExpected: number;
  totalCollected: number;
  outstanding: number;
  collectionRate: number;
}

export interface FeeLine {
  id: string;
  feeGroupId: string;
  feeGroupName: string;
  feeItemId: string;
  feeItemLabel: string;
  amount: number;
  priority: number;
}

export interface Allocation {
  id: string;
  paymentId: string;
  studentId: string;
  feeLineId: string;
  amount: number;
  feeGroupName?: string;
  feeItemLabel?: string;
  reversed?: boolean;
  createdAt: string;
  createdBy: string;
}

export interface StudentAccount {
  studentId: string;
  totalFees: number;
  totalPaid: number;
  balance: number;
  credit: number;
  updatedAt: string;
}

export interface Credit {
  id: string;
  studentId: string;
  amount: number;
  sourcePaymentId: string;
  createdAt: string;
  usedAmount: number;
  remainingAmount: number;
}

export type AuditAction =
  | 'ALLOCATE'
  | 'REALLOCATE'
  | 'PAYMENT_CREATE'
  | 'PAYMENT_DELETE'
  | 'CLAIM_SUBMIT'
  | 'CLAIM_APPROVE'
  | 'CLAIM_REJECT'
  | 'CLAIM_NOT_FOUND'
  | 'CSV_IMPORT'
  | 'ROW_ASSIGN'
  | 'MANUAL_ADJUST'
  | 'SETTINGS_CHANGE';

export interface AuditLog {
  id: string;
  studentId: string;
  paymentId?: string;
  allocationId?: string;
  action: AuditAction;
  performedBy: string;
  performedAt: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  reason?: string;
}

export type ClaimStatus = 'PENDING' | 'NEEDS_REVIEW' | 'APPROVED' | 'REJECTED' | 'NOT_FOUND';

export interface PaymentClaim {
  id: string;
  studentId: string;
  studentName?: string;
  gradeName?: string;
  payerPhone: string;
  amount: number;
  transactionId: string;
  paymentDate: string;
  method?: PaymentMethod;
  screenshot?: string;
  notes?: string;
  status: ClaimStatus;
  matchReason?: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
  matchedPaymentId?: string;
}

export type StatementRowStatus = 'UNCLAIMED' | 'MATCHED' | 'ASSIGNED' | 'DUPLICATE' | 'SKIPPED';
export type StatementDirection = 'IN' | 'OUT';

export interface StatementRow {
  id: string;
  importId: string;
  transactionId: string;
  date: string;
  amount: number;
  senderPhone: string;
  senderName: string;
  receiverTill: string;
  direction: StatementDirection;
  status: StatementRowStatus;
  claimId?: string | null;
  claimStatus?: ClaimStatus | null;
  studentId?: string | null;
  studentName?: string | null;
  matchType?: string;
  matchReason?: string;
}

export interface StatementImport {
  id: string;
  fileName: string;
  fileHash: string;
  mapping: CsvMapping;
  uploadedAt: string;
  uploadedBy: string;
  totalRows: number;
  importedRows: number;
  skippedRows: number;
  matchedClaims: number;
  status: 'COMPLETED' | 'FAILED';
}

export type CsvMappingField =
  | 'transactionId'
  | 'date'
  | 'amount'
  | 'senderPhone'
  | 'senderName'
  | 'receiverTill'
  | 'direction';

export type CsvMapping = Partial<Record<CsvMappingField, string>>;

export interface ParentSummary {
  name: string;
  phone: string;
  students: Array<{
    id: string;
    application_no: string;
    name: string;
    grade: string;
    status: StudentStatus;
    total_fees: number;
    total_paid: number;
    balance: number;
    credit: number;
  }>;
}

export interface AppSettings {
  allocationOrder: AllocationRule[];
  notFoundDays: number;
  csvMapping: CsvMapping | null;
}

export type MatchType = 'EXACT' | 'PHONE_MISMATCH' | 'AMOUNT_MISMATCH' | 'AMOUNT_PHONE_MISMATCH';

export type ReviewQueueItemKind = 'NEEDS_REVIEW' | 'UNCLAIMED' | 'NOT_FOUND';

export interface AuditEntry {
  id: string;
  studentId?: string | null;
  studentName?: string | null;
  paymentId?: string | null;
  action: AuditAction;
  performedBy: string;
  performedAt: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  reason?: string;
}

export interface AllocationRule {
  feeGroupName: string;
  priority: number;
}
