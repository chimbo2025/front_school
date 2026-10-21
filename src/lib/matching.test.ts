import { describe, it, expect } from 'vitest';
import {
  normalizePhone, isValidPhone, phonesForParent, matchRows, findNotFoundClaims,
} from './matching';
import { PaymentClaim, Student } from '../types';

const makeStudent = (overrides: Partial<Student> = {}): Student => ({
  id: 'stu-1',
  applicationNo: 'APP-001',
  firstName: 'Mwanaisha',
  lastName: 'Ali',
  gender: 'Female',
  dob: '2015-04-12',
  address: 'Zanzibar',
  parentName: 'Bi Fatma Mohamed',
  parentPhone: '0777123456',
  parentAddress: 'Zanzibar',
  parentRelationship: 'Mother',
  parentNationalId: '12345678',
  emergencyContactName: '',
  emergencyContactPhone: '',
  emergencyContactRelationship: 'Other',
  gradeId: 'grade-1',
  academicYear: '2026',
  status: 'Pending',
  createdAt: '2026-01-01T00:00:00Z',
  ...overrides,
});

const makeClaim = (overrides: Partial<PaymentClaim> = {}): PaymentClaim => ({
  id: 'claim-1',
  studentId: 'stu-1',
  payerPhone: '0777123456',
  amount: 150000,
  transactionId: 'MP260110091',
  paymentDate: '2026-01-10',
  status: 'PENDING',
  submittedAt: '2026-01-10T08:00:00Z',
  ...overrides,
});

describe('normalizePhone', () => {
  it('normalises local, +255 and bare formats to 0XXXXXXXXX', () => {
    expect(normalizePhone('0777123456')).toBe('0777123456');
    expect(normalizePhone('+255777123456')).toBe('0777123456');
    expect(normalizePhone('255777123456')).toBe('0777123456');
    expect(normalizePhone('777123456')).toBe('0777123456');
    expect(normalizePhone('0777 123 456')).toBe('0777123456');
    expect(normalizePhone('')).toBe('');
    expect(normalizePhone('12345')).toBe('');
  });

  it('isValidPhone mirrors normalizePhone', () => {
    expect(isValidPhone('0682987654')).toBe(true);
    expect(isValidPhone('not-a-phone')).toBe(false);
  });
});

describe('scenario 1: exact match (txn + amount + phone)', () => {
  it('marks the row MATCHED/EXACT and counts it as auto-approve', () => {
    const student = makeStudent();
    const claim = makeClaim();
    const result = matchRows(
      [{ transactionId: 'MP260110091', date: '2026-01-10', amount: 150000, senderPhone: '0777123456', direction: 'IN' }],
      [claim],
      [student]
    );
    expect(result.exactCount).toBe(1);
    expect(result.rows[0].status).toBe('MATCHED');
    expect(result.rows[0].matchType).toBe('EXACT');
    expect(result.claims.find((c) => c.claimId === 'claim-1')?.status).toBe('MATCHED');
  });
});

describe('scenario 2: phone mismatch → NEEDS_REVIEW', () => {
  it('links the row but flags the payer phone as unrecognised', () => {
    const student = makeStudent();
    const claim = makeClaim();
    const result = matchRows(
      [{ transactionId: 'MP260110091', date: '2026-01-10', amount: 150000, senderPhone: '0712345678', direction: 'IN' }],
      [claim],
      [student]
    );
    expect(result.exactCount).toBe(0);
    expect(result.needsReviewCount).toBe(1);
    expect(result.rows[0].matchType).toBe('PHONE_MISMATCH');
    expect(result.rows[0].reason).toContain('does not match');
    expect(result.claims.find((c) => c.claimId === 'claim-1')?.status).toBe('NEEDS_REVIEW');
  });

  it('accepts +255 format of the same number as a match', () => {
    const student = makeStudent();
    const claim = makeClaim();
    const result = matchRows(
      [{ transactionId: 'MP260110091', date: '2026-01-10', amount: 150000, senderPhone: '+255777123456', direction: 'IN' }],
      [claim],
      [student]
    );
    expect(result.exactCount).toBe(1);
  });
});

describe('scenario 3: amount mismatch → NEEDS_REVIEW', () => {
  it('states both amounts in the reason', () => {
    const student = makeStudent();
    const claim = makeClaim({ amount: 200000 });
    const result = matchRows(
      [{ transactionId: 'MP260110091', date: '2026-01-10', amount: 150000, senderPhone: '0777123456', direction: 'IN' }],
      [claim],
      [student]
    );
    expect(result.needsReviewCount).toBe(1);
    expect(result.rows[0].matchType).toBe('AMOUNT_MISMATCH');
    expect(result.rows[0].reason).toContain('150,000');
    expect(result.rows[0].reason).toContain('200,000');
  });
});

describe('scenario 4: duplicate transaction IDs', () => {
  it('marks a row DUPLICATE when the txn ID already exists on the statement', () => {
    const student = makeStudent();
    const claim = makeClaim();
    const result = matchRows(
      [{ transactionId: 'MP260110091', date: '2026-01-10', amount: 150000, senderPhone: '0777123456', direction: 'IN' }],
      [claim],
      [student],
      ['MP260110091']
    );
    expect(result.duplicateCount).toBe(1);
    expect(result.rows[0].status).toBe('DUPLICATE');
    expect(result.exactCount).toBe(0);
  });

  it('marks the second occurrence inside the same file as DUPLICATE', () => {
    const student = makeStudent();
    const result = matchRows(
      [
        { transactionId: 'MP260110091', date: '2026-01-10', amount: 150000, senderPhone: '0777123456', direction: 'IN' },
        { transactionId: 'MP260110091', date: '2026-01-10', amount: 150000, senderPhone: '0777123456', direction: 'IN' },
      ],
      [makeClaim()],
      [student]
    );
    expect(result.exactCount).toBe(1);
    expect(result.duplicateCount).toBe(1);
  });

  it('skips outgoing rows', () => {
    const result = matchRows(
      [{ transactionId: 'MP260110099', date: '2026-01-10', amount: 50000, senderPhone: '0777123456', direction: 'OUT' }],
      [],
      []
    );
    expect(result.skippedCount).toBe(1);
    expect(result.rows[0].status).toBe('SKIPPED');
  });
});

describe('scenario 5: partial payment stays open', () => {
  it('an exact partial payment still matches — allocation handles the shortfall', () => {
    const student = makeStudent();
    const claim = makeClaim({ amount: 150000 });
    const result = matchRows(
      [{ transactionId: 'MP260110091', date: '2026-01-10', amount: 150000, senderPhone: '0777123456', direction: 'IN' }],
      [claim],
      [student]
    );
    expect(result.exactCount).toBe(1);
  });
});

describe('scenario 9: two children of the same parent', () => {
  it('a sibling payer phone counts for either child', () => {
    const parentPhone = '0777123456';
    const studentA = makeStudent({ id: 'stu-a', parentPhone });
    const studentB = makeStudent({ id: 'stu-b', parentPhone, emergencyContactPhone: '0711000111' });
    const claimA = makeClaim({ id: 'claim-a', studentId: 'stu-a', payerPhone: parentPhone, transactionId: 'MPAAA111' });
    const claimB = makeClaim({ id: 'claim-b', studentId: 'stu-b', payerPhone: '0711000111', transactionId: 'MPBBB222' });

    expect(phonesForParent(studentB, [studentA, studentB], [claimA, claimB])).toEqual(
      expect.arrayContaining(['0777123456', '0711000111'])
    );

    // A payment from the emergency phone for student B matches exactly.
    const result = matchRows(
      [{ transactionId: 'MPBBB222', date: '2026-01-12', amount: 150000, senderPhone: '0711000111', direction: 'IN' }],
      [claimA, claimB],
      [studentA, studentB]
    );
    expect(result.exactCount).toBe(1);
    expect(result.rows[0].studentId).toBe('stu-b');
  });
});

describe('scenario 10: re-importing the same statement', () => {
  it('rows whose txn IDs already exist are all duplicates and nothing re-matches', () => {
    const student = makeStudent();
    const claim = makeClaim({ status: 'APPROVED' });
    const result = matchRows(
      [{ transactionId: 'MP260110091', date: '2026-01-10', amount: 150000, senderPhone: '0777123456', direction: 'IN' }],
      [claim],
      [student],
      ['MP260110091']
    );
    expect(result.duplicateCount).toBe(1);
    expect(result.exactCount).toBe(0);
    // approved claims are not open, so no claim outcome either
    expect(result.claims).toHaveLength(0);
  });
});

describe('findNotFoundClaims', () => {
  const now = new Date('2026-01-20T00:00:00Z');

  it('marks old claims without a statement row NOT_FOUND', () => {
    const old = makeClaim({ id: 'old', submittedAt: '2026-01-10T00:00:00Z' });
    const fresh = makeClaim({ id: 'fresh', transactionId: 'MPFRESH', submittedAt: '2026-01-19T00:00:00Z' });
    const { notFound, restored } = findNotFoundClaims([old, fresh], [], 3, now);
    expect(notFound.map((c) => c.id)).toEqual(['old']);
    expect(restored).toHaveLength(0);
  });

  it('restores NOT_FOUND claims that now have a statement row', () => {
    const claim = makeClaim({ id: 'nf', status: 'NOT_FOUND' });
    const { notFound, restored } = findNotFoundClaims(
      [claim],
      [{ id: 'srow-1', importId: 'i1', transactionId: 'MP260110091', date: '2026-01-10', amount: 150000, senderPhone: '0777123456', senderName: '', receiverTill: '', direction: 'IN', status: 'MATCHED', claimId: 'nf' }],
      3,
      now
    );
    expect(notFound).toHaveLength(0);
    expect(restored.map((c) => c.id)).toEqual(['nf']);
  });
});
