import { FeeGroup, FeeItem, Grade } from '../types';

/**
 * Coerce a fee amount to a number.
 *
 * The API serialises Django `DecimalField` values as strings (e.g.
 * `"150000.00"`), so summing them directly concatenates strings and produces
 * `NaN` once `Intl.NumberFormat` receives the result. Everything that does
 * arithmetic on amounts should go through this helper.
 */
export function toAmount(value: unknown): number {
  const amount = typeof value === 'number' ? value : Number(value ?? 0);
  return Number.isFinite(amount) ? amount : 0;
}

export function itemAmount(item: FeeItem | undefined): number {
  return toAmount(item?.amount);
}

/** Sum of every item in one fee group (admission, tuition, transport, other…). */
export function groupSubtotal(group: FeeGroup | undefined): number {
  return (group?.items || []).reduce((sum, item) => sum + itemAmount(item), 0);
}

/** Sum of all fee groups for a grade, i.e. the annual total. */
export function gradeTotal(grade: Grade | undefined): number {
  return (grade?.feeGroups || []).reduce((sum, group) => sum + groupSubtotal(group), 0);
}
