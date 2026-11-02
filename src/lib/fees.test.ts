import { describe, it, expect } from 'vitest';
import { groupSubtotal, gradeTotal, itemAmount, toAmount } from './fees';
import { Grade } from '../types';

describe('toAmount', () => {
  it('coerces API decimal strings', () => {
    expect(toAmount('150000.00')).toBe(150000);
  });

  it('falls back to 0 for missing/invalid values', () => {
    expect(toAmount(undefined)).toBe(0);
    expect(toAmount(null)).toBe(0);
    expect(toAmount('not-a-number')).toBe(0);
    expect(toAmount(NaN)).toBe(0);
  });
});

describe('gradeTotal', () => {
  const grade = {
    id: 'g1',
    name: 'Standard 1',
    feeGroups: [
      { id: 'adm', name: 'ADMISSION FEE', items: [{ id: 'a', label: 'Admission', amount: '150000.00' }] },
      {
        id: 'sch',
        name: 'SCHOOL FEE',
        items: [
          { id: 'b', label: 'Tuition', amount: '1175000.00' },
          { id: 'c', label: 'Books', amount: '50000.00' },
        ],
      },
      { id: 'tra', name: 'TRANSPORT FEE', items: [{ id: 'd', label: 'Bus', amount: '600000.00' }] },
      { id: 'oth', name: 'OTHER FEE', items: [{ id: 'e', label: 'Exam', amount: '25000.00' }] },
    ],
  } as unknown as Grade;

  it('adds every fee group instead of concatenating strings', () => {
    expect(gradeTotal(grade)).toBe(150000 + 1175000 + 50000 + 600000 + 25000);
  });

  it('returns 0 for a missing grade or groups', () => {
    expect(gradeTotal(undefined)).toBe(0);
    expect(gradeTotal({ id: 'g', name: 'Empty', feeGroups: [] })).toBe(0);
  });

  it('sums a single group independently', () => {
    expect(groupSubtotal(grade.feeGroups[1])).toBe(1175000 + 50000);
  });

  it('treats a missing amount as 0', () => {
    expect(itemAmount(undefined)).toBe(0);
  });
});
