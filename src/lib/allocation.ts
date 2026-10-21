import {
  FeeGroup,
  FeeItem,
  Grade,
  Payment,
  Student,
  Allocation,
  FeeLine,
  StudentAccount,
  Credit,
  AllocationRule,
} from '../types';

const DEFAULT_ALLOCATION_PRIORITY: AllocationRule[] = [
  { feeGroupName: 'ADMISSION FEE', priority: 1 },
  { feeGroupName: 'SCHOOL FEE', priority: 2 },
  { feeGroupName: 'TRANSPORT FEE', priority: 3 },
  { feeGroupName: 'OTHER FEE', priority: 4 },
];

export function buildFeeLines(grade: Grade, rules: AllocationRule[] = DEFAULT_ALLOCATION_PRIORITY): FeeLine[] {
  const priorityMap = new Map(rules.map((r, i) => [r.feeGroupName.toUpperCase(), r.priority ?? i + 1]));

  const lines: FeeLine[] = [];
  for (const group of grade.feeGroups || []) {
    const groupPriority = priorityMap.get(group.name.toUpperCase()) ?? 99;
    for (const item of group.items || []) {
      lines.push({
        id: `${group.id}::${item.id}`,
        feeGroupId: group.id,
        feeGroupName: group.name,
        feeItemId: item.id,
        feeItemLabel: item.label,
        amount: item.amount,
        priority: groupPriority,
      });
    }
  }

  lines.sort((a, b) => a.priority - b.priority);
  return lines;
}

export function computeStudentAccount(
  student: Student,
  grade: Grade,
  payments: Payment[],
  existingAllocations: Allocation[] = [],
  rules: AllocationRule[] = DEFAULT_ALLOCATION_PRIORITY
): StudentAccount {
  const feeLines = buildFeeLines(grade, rules);
  const totalFees = feeLines.reduce((sum, l) => sum + l.amount, 0);

  const activeAllocations = existingAllocations.filter((a) => !a.reversed);
  const sortedPayments = [...payments].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const linePaidMap = new Map<string, number>();
  for (const alloc of activeAllocations) {
    linePaidMap.set(alloc.feeLineId, (linePaidMap.get(alloc.feeLineId) || 0) + alloc.amount);
  }

  let credit = 0;
  const newAllocations: Allocation[] = [];

  for (const payment of sortedPayments) {
    let remaining = payment.amount;

    const alreadyAllocated = activeAllocations
      .filter((a) => a.paymentId === payment.id)
      .reduce((sum, a) => sum + a.amount, 0);

    if (alreadyAllocated >= payment.amount) {
      continue;
    }

    remaining -= alreadyAllocated;

    for (const line of feeLines) {
      if (remaining <= 0) break;
      const paidOnLine = linePaidMap.get(line.id) || 0;
      const dueOnLine = line.amount - paidOnLine;
      if (dueOnLine <= 0) continue;

      const allocAmount = Math.min(remaining, dueOnLine);
      newAllocations.push({
        id: `alloc-${payment.id}-${line.id}-${Date.now()}`,
        paymentId: payment.id,
        studentId: student.id,
        feeLineId: line.id,
        amount: allocAmount,
        createdAt: new Date().toISOString(),
        createdBy: 'system',
      });
      linePaidMap.set(line.id, paidOnLine + allocAmount);
      remaining -= allocAmount;
    }

    if (remaining > 0) {
      credit += remaining;
    }
  }

  const totalPaid = sortedPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalAllocated = [...activeAllocations, ...newAllocations].reduce((sum, a) => sum + a.amount, 0);
  const balance = Math.max(0, totalFees - totalAllocated);

  return {
    studentId: student.id,
    totalFees,
    totalPaid,
    balance,
    credit,
    updatedAt: new Date().toISOString(),
  };
}

export function allocatePayment(
  payment: Payment,
  student: Student,
  grade: Grade,
  existingAllocations: Allocation[],
  rules: AllocationRule[] = DEFAULT_ALLOCATION_PRIORITY
): { allocations: Allocation[]; creditCreated: number } {
  const feeLines = buildFeeLines(grade, rules);

  const linePaidMap = new Map<string, number>();
  for (const alloc of existingAllocations) {
    if (alloc.reversed) continue;
    linePaidMap.set(alloc.feeLineId, (linePaidMap.get(alloc.feeLineId) || 0) + alloc.amount);
  }

  let remaining = payment.amount;
  const newAllocations: Allocation[] = [];

  for (const line of feeLines) {
    if (remaining <= 0) break;
    const paidOnLine = linePaidMap.get(line.id) || 0;
    const dueOnLine = line.amount - paidOnLine;
    if (dueOnLine <= 0) continue;

    const allocAmount = Math.min(remaining, dueOnLine);
    newAllocations.push({
      id: `alloc-${payment.id}-${line.id}-${Date.now()}`,
      paymentId: payment.id,
      studentId: student.id,
      feeLineId: line.id,
      amount: allocAmount,
      createdAt: new Date().toISOString(),
      createdBy: 'system',
    });
    linePaidMap.set(line.id, paidOnLine + allocAmount);
    remaining -= allocAmount;
  }

  return { allocations: newAllocations, creditCreated: remaining };
}

/**
 * Reallocate money from one payment to a different fee line.
 *
 * The payment's existing allocations are reversed in full, `amount` is placed
 * on the target fee line first, and the remainder is re-filled across the fee
 * lines in the configured priority order. This keeps the payment fully
 * allocated while letting the admin redirect money (typically to a
 * later-priority line such as transport).
 *
 * Returns the ids to reverse and the brand-new allocations to persist.
 */
export function reallocatePayment(
  payment: Payment,
  student: Student,
  grade: Grade,
  existingAllocations: Allocation[],
  targetFeeLineId: string,
  amount: number,
  reason: string,
  performedBy: string,
  rules: AllocationRule[] = DEFAULT_ALLOCATION_PRIORITY
): { reversedIds: string[]; allocations: Allocation[] } {
  void reason;
  const feeLines = buildFeeLines(grade, rules);
  const targetLine = feeLines.find((l) => l.id === targetFeeLineId);
  if (!targetLine) throw new Error('Target fee line not found');

  const paymentAllocs = existingAllocations.filter(
    (a) => a.paymentId === payment.id && !a.reversed
  );
  const freedAmount = paymentAllocs.reduce((sum, a) => sum + a.amount, 0);
  if (amount > freedAmount) {
    throw new Error(`Cannot reallocate ${amount}: only ${freedAmount} available from this payment`);
  }

  const otherAllocs = existingAllocations.filter(
    (a) => a.paymentId !== payment.id && !a.reversed
  );

  const linePaidMap = new Map<string, number>();
  for (const alloc of otherAllocs) {
    linePaidMap.set(alloc.feeLineId, (linePaidMap.get(alloc.feeLineId) || 0) + alloc.amount);
  }

  const targetDue = targetLine.amount - (linePaidMap.get(targetFeeLineId) || 0);
  if (amount > targetDue) {
    throw new Error(`Target line only has ${targetDue} due — cannot allocate ${amount}`);
  }

  const newAllocations: Allocation[] = [];
  let remaining = payment.amount;
  let targetPlaced = 0;

  const push = (line: FeeLine, allocAmount: number) => {
    if (allocAmount <= 0) return;
    newAllocations.push({
      id: `alloc-${payment.id}-${line.id}-${newAllocations.length}-${Date.now()}`,
      paymentId: payment.id,
      studentId: student.id,
      feeLineId: line.id,
      feeGroupName: line.feeGroupName,
      feeItemLabel: line.feeItemLabel,
      amount: allocAmount,
      createdAt: new Date().toISOString(),
      createdBy: performedBy,
    });
    linePaidMap.set(line.id, (linePaidMap.get(line.id) || 0) + allocAmount);
    remaining -= allocAmount;
  };

  // 1. Put the reallocated amount on the target line.
  push(targetLine, amount);
  targetPlaced = amount;

  // 2. Re-fill the rest of the payment across the priority order.
  for (const line of feeLines) {
    if (remaining <= 0) break;
    const paidOnLine = linePaidMap.get(line.id) || 0;
    const dueOnLine = line.amount - paidOnLine;
    if (dueOnLine <= 0) continue;
    push(line, Math.min(remaining, dueOnLine));
  }

  void targetPlaced;

  return {
    reversedIds: paymentAllocs.map((a) => a.id),
    allocations: newAllocations,
  };
}

export function getFeeLineById(grade: Grade, feeLineId: string, rules: AllocationRule[] = DEFAULT_ALLOCATION_PRIORITY): FeeLine | undefined {
  const lines = buildFeeLines(grade, rules);
  return lines.find((l) => l.id === feeLineId);
}

export function getAllocationBreakdown(
  student: Student,
  grade: Grade,
  payments: Payment[],
  allocations: Allocation[],
  rules: AllocationRule[] = DEFAULT_ALLOCATION_PRIORITY
): Array<{
  feeLine: FeeLine;
  paid: number;
  due: number;
  status: 'UNPAID' | 'PARTIAL' | 'PAID';
  allocations: Allocation[];
}> {
  const feeLines = buildFeeLines(grade, rules);
  const lineAllocMap = new Map<string, Allocation[]>();
  for (const alloc of allocations) {
    if (alloc.reversed) continue;
    if (!lineAllocMap.has(alloc.feeLineId)) lineAllocMap.set(alloc.feeLineId, []);
    lineAllocMap.get(alloc.feeLineId)!.push(alloc);
  }

  return feeLines.map((line) => {
    const lineAllocs = lineAllocMap.get(line.id) || [];
    const paid = lineAllocs.reduce((sum, a) => sum + a.amount, 0);
    const due = line.amount - paid;
    let status: 'UNPAID' | 'PARTIAL' | 'PAID' = 'UNPAID';
    if (paid === 0) status = 'UNPAID';
    else if (due > 0) status = 'PARTIAL';
    else status = 'PAID';
    return { feeLine: line, paid, due, status, allocations: lineAllocs };
  });
}

export function hasDuplicateTransactionId(payments: Payment[], reference: string, excludeId?: string): boolean {
  return payments.some((p) => p.reference === reference && p.id !== excludeId);
}

export function formatTsh(amount: number): string {
  return new Intl.NumberFormat('en-US').format(amount) + ' Tsh';
}

export function backfillAllocations(
  students: Student[],
  grades: Grade[],
  payments: Payment[]
): Allocation[] {
  const allAllocations: Allocation[] = [];

  for (const student of students) {
    const grade = grades.find((g) => g.id === student.gradeId);
    if (!grade) continue;

    const studentPayments = payments
      .filter((p) => p.studentId === student.id)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let existingAllocs: Allocation[] = [];
    for (const payment of studentPayments) {
      const { allocations } = allocatePayment(payment, student, grade, existingAllocs);
      allAllocations.push(...allocations);
      existingAllocs.push(...allocations);
    }
  }

  return allAllocations;
}

export { DEFAULT_ALLOCATION_PRIORITY };