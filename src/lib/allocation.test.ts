import { describe, it, expect } from 'vitest';
import {
  buildFeeLines, allocatePayment, reallocatePayment,
  computeStudentAccount, getAllocationBreakdown,
} from './allocation';
import { Allocation, Grade, Payment, Student } from '../types';

const grade: Grade = {
  id: 'grade-1',
  name: 'Standard 1',
  feeGroups: [
    { id: 'fg-adm', name: 'ADMISSION FEE', items: [{ id: 'fi-adm', label: 'Admission', amount: 100000 }] },
    { id: 'fg-sch', name: 'SCHOOL FEE', items: [{ id: 'fi-sch', label: 'Term 1 Tuition', amount: 400000 }] },
    { id: 'fg-tra', name: 'TRANSPORT FEE', items: [{ id: 'fi-tra', label: 'Bus Route A', amount: 200000 }] },
    { id: 'fg-oth', name: 'OTHER FEE', items: [{ id: 'fi-oth', label: 'Exam Fee', amount: 50000 }] },
  ],
};

const student: Student = {
  id: 'stu-1', applicationNo: 'APP-001', firstName: 'Asha', lastName: 'Juma',
  gender: 'Female', dob: '2015-01-01', address: 'Zanzibar',
  parentName: 'Fatma', parentPhone: '0777123456', parentAddress: 'Zanzibar',
  parentRelationship: 'Mother', parentNationalId: '1',
  emergencyContactName: '', emergencyContactPhone: '', emergencyContactRelationship: 'Other',
  gradeId: 'grade-1', academicYear: '2026', status: 'Admitted', createdAt: '2026-01-01T00:00:00Z',
};

const payment = (id: string, amount: number, date = '2026-01-10', reference = `REF-${id}`): Payment => ({
  id, studentId: 'stu-1', amount, date, method: 'M-Pesa', reference, source: 'CLAIM',
});

describe('buildFeeLines', () => {
  it('orders lines by the configured allocation priority', () => {
    const lines = buildFeeLines(grade);
    expect(lines.map((l) => l.feeGroupName)).toEqual([
      'ADMISSION FEE', 'SCHOOL FEE', 'TRANSPORT FEE', 'OTHER FEE',
    ]);
    expect(lines[0].id).toBe('fg-adm::fi-adm');
  });

  it('honours a custom allocation order', () => {
    const lines = buildFeeLines(grade, [
      { feeGroupName: 'SCHOOL FEE', priority: 1 },
      { feeGroupName: 'ADMISSION FEE', priority: 2 },
      { feeGroupName: 'TRANSPORT FEE', priority: 3 },
      { feeGroupName: 'OTHER FEE', priority: 4 },
    ]);
    expect(lines[0].feeGroupName).toBe('SCHOOL FEE');
  });
});

describe('scenario 6: full payment allocation', () => {
  it('fills fee lines in priority order until the payment is exhausted', () => {
    const { allocations, creditCreated } = allocatePayment(payment('p1', 250000), student, grade, []);
    expect(creditCreated).toBe(0);
    expect(allocations).toEqual([
      expect.objectContaining({ feeLineId: 'fg-adm::fi-adm', amount: 100000 }),
      expect.objectContaining({ feeLineId: 'fg-sch::fi-sch', amount: 150000 }),
    ]);
    expect(allocations.reduce((s, a) => s + a.amount, 0)).toBe(250000);
  });
});

describe('scenario 5: partial payment', () => {
  it('allocates only what the payment covers', () => {
    const { allocations, creditCreated } = allocatePayment(payment('p1', 80000), student, grade, []);
    expect(creditCreated).toBe(0);
    expect(allocations).toEqual([
      expect.objectContaining({ feeLineId: 'fg-adm::fi-adm', amount: 80000 }),
    ]);
  });

  it('spans multiple lines when the payment exceeds the first line', () => {
    const { allocations } = allocatePayment(payment('p1', 120000), student, grade, []);
    expect(allocations.map((a) => a.feeLineId)).toEqual(['fg-adm::fi-adm', 'fg-sch::fi-sch']);
    expect(allocations[1].amount).toBe(20000);
  });
});

describe('scenario 8: overpayment becomes credit', () => {
  it('returns leftover money as credit rather than over-allocating', () => {
    const totalFees = 750000;
    const { allocations, creditCreated } = allocatePayment(payment('p1', totalFees + 50000), student, grade, []);
    const allocated = allocations.reduce((s, a) => s + a.amount, 0);
    expect(allocated).toBe(totalFees);
    expect(creditCreated).toBe(50000);
  });
});

describe('scenario 7: reallocation', () => {
  it('reverses the payment, places money on the target first, then re-fills', () => {
    // p1 (250k) already allocated: 100k admission + 150k school.
    const existing: Allocation[] = [
      { id: 'a1', paymentId: 'p1', studentId: 'stu-1', feeLineId: 'fg-adm::fi-adm', amount: 100000, createdAt: '2026-01-10T00:00:00Z', createdBy: 'system' },
      { id: 'a2', paymentId: 'p1', studentId: 'stu-1', feeLineId: 'fg-sch::fi-sch', amount: 150000, createdAt: '2026-01-10T00:00:00Z', createdBy: 'system' },
    ];
    const result = reallocatePayment(
      payment('p1', 250000), student, grade, existing,
      'fg-tra::fi-tra', 100000, 'Parent requested transport first', 'accountant'
    );
    expect(result.reversedIds).toEqual(['a1', 'a2']);
    // 100k on transport first, remainder 150k backfills: admission 100k, school 50k
    expect(result.allocations).toEqual([
      expect.objectContaining({ feeLineId: 'fg-tra::fi-tra', amount: 100000 }),
      expect.objectContaining({ feeLineId: 'fg-adm::fi-adm', amount: 100000 }),
      expect.objectContaining({ feeLineId: 'fg-sch::fi-sch', amount: 50000 }),
    ]);
    // payment stays fully allocated
    expect(result.allocations.reduce((s, a) => s + a.amount, 0)).toBe(250000);
  });

  it('refuses to reallocate more than the payment holds', () => {
    expect(() =>
      reallocatePayment(payment('p1', 100000), student, grade, [], 'fg-sch::fi-sch', 150000, 'why', 'me')
    ).toThrow(/only 0 available/);
  });

  it('refuses to overfill the target line', () => {
    expect(() =>
      reallocatePayment(payment('p1', 500000), student, grade, [], 'fg-oth::oth', 60000, 'why', 'me')
    ).toThrow(/not found|only/i);
  });

  it('counts other payments against the target line when checking room', () => {
    // Another payment already filled the 50k exam line, and p1 holds 100k on admission.
    const existing: Allocation[] = [
      { id: 'a8', paymentId: 'p1', studentId: 'stu-1', feeLineId: 'fg-adm::fi-adm', amount: 100000, createdAt: '2026-01-10T00:00:00Z', createdBy: 'system' },
      { id: 'a9', paymentId: 'p9', studentId: 'stu-1', feeLineId: 'fg-oth::fi-oth', amount: 50000, createdAt: '2026-01-09T00:00:00Z', createdBy: 'system' },
    ];
    expect(() =>
      reallocatePayment(payment('p1', 100000), student, grade, existing, 'fg-oth::fi-oth', 10000, 'why', 'me')
    ).toThrow(/only has 0 due/);
  });
});

describe('scenario 9: two children of the same parent', () => {
  it('allocations are kept per student and never bleed across siblings', () => {
    const sibling: Student = { ...student, id: 'stu-2', firstName: 'Ali' };
    const p1 = payment('p1', 100000);
    const p2 = payment('p2', 100000);

    const a1 = allocatePayment(p1, student, grade, []);
    const a2 = allocatePayment(p2, sibling, grade, []);

    expect(a1.allocations.every((a) => a.studentId === 'stu-1')).toBe(true);
    expect(a2.allocations.every((a) => a.studentId === 'stu-2')).toBe(true);

    // Sibling's payment does not reduce the first student's balance.
    const account = computeStudentAccount(student, grade, [p1], a1.allocations);
    expect(account.totalPaid).toBe(100000);
    expect(account.balance).toBe(750000 - 100000);
  });
});

describe('reversed allocations are ignored by the engine', () => {
  it('computeStudentAccount and getAllocationBreakdown skip reversed rows', () => {
    const reversed: Allocation[] = [
      { id: 'a1', paymentId: 'p1', studentId: 'stu-1', feeLineId: 'fg-adm::fi-adm', amount: 100000, reversed: true, createdAt: '2026-01-10T00:00:00Z', createdBy: 'system' },
    ];
    const active: Allocation[] = [
      { id: 'a2', paymentId: 'p2', studentId: 'stu-1', feeLineId: 'fg-sch::fi-sch', amount: 50000, createdAt: '2026-01-11T00:00:00Z', createdBy: 'system' },
    ];
    const account = computeStudentAccount(student, grade, [payment('p1', 100000), payment('p2', 50000)], [...reversed, ...active]);
    // p1 is fully reversed, so its 100k is unallocated and p1 re-allocates itself;
    // line admission paid = 0 (reversed), so p1 fills admission again.
    const breakdown = getAllocationBreakdown(student, grade, [], [...reversed, ...active]);
    const admission = breakdown.find((b) => b.feeLine.id === 'fg-adm::fi-adm')!;
    const school = breakdown.find((b) => b.feeLine.id === 'fg-sch::fi-sch')!;
    expect(admission.paid).toBe(0);
    expect(school.paid).toBe(50000);
    expect(account.totalPaid).toBe(150000);
  });
});
