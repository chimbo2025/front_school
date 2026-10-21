import { PaymentClaim, Student, MatchType, StatementRow, ClaimStatus } from '../types';

export const NOT_FOUND_DEFAULT_DAYS = 3;

/**
 * Normalise any Tanzanian mobile number to the canonical 0XXXXXXXXX form.
 * Accepts: 0777123456, +255777123456, 255777123456, 777123456,
 * with or without spaces / dashes / dots.
 * Returns '' when the input cannot be normalised.
 */
export function normalizePhone(phone: string): string {
  if (!phone) return '';
  let digits = phone.replace(/[^\d]/g, '');
  if (!digits) return '';
  if (digits.startsWith('255')) digits = '0' + digits.slice(3);
  else if (digits.length === 9) digits = '0' + digits;
  if (/^0\d{9}$/.test(digits)) return digits;
  return '';
}

/** Same rules as normalizePhone — a claim/row phone is valid when it normalises. */
export function isValidPhone(phone: string): boolean {
  return normalizePhone(phone) !== '';
}

/**
 * All phone numbers that can legitimately appear as the payer for this student:
 * the parent's phone, the emergency contact phone, and any payer phone a sibling
 * (same parent) has used on an earlier claim.
 */
export function phonesForParent(
  student: Student,
  students: Student[],
  claims: PaymentClaim[]
): string[] {
  const phones = new Set<string>();
  const add = (p?: string) => {
    const n = normalizePhone(p || '');
    if (n) phones.add(n);
  };

  add(student.parentPhone);
  add(student.emergencyContactPhone);

  const siblings = students.filter(
    (s) => normalizePhone(s.parentPhone) === normalizePhone(student.parentPhone)
  );
  for (const s of siblings) {
    add(s.parentPhone);
    add(s.emergencyContactPhone);
    for (const c of claims) {
      if (c.studentId === s.id) add(c.payerPhone);
    }
  }

  return [...phones];
}

export type RowStatus = 'MATCHED' | 'UNCLAIMED' | 'DUPLICATE' | 'SKIPPED';
export type ClaimOutcome = 'MATCHED' | 'NEEDS_REVIEW' | 'UNMATCHED';

export interface MatchableRow {
  transactionId: string;
  date: string;
  amount: number;
  senderPhone: string;
  direction: 'IN' | 'OUT';
  senderName?: string;
  receiverTill?: string;
}

export interface RowMatchResult {
  row: MatchableRow;
  rowNumber: number;
  status: RowStatus;
  claimId?: string;
  studentId?: string;
  matchType?: MatchType;
  reason?: string;
}

export interface ClaimMatchResult {
  claimId: string;
  status: ClaimOutcome;
  matchType?: MatchType;
  reason?: string;
  rowNumber?: number;
}

export interface MatchResult {
  rows: RowMatchResult[];
  claims: ClaimMatchResult[];
  exactCount: number;
  needsReviewCount: number;
  unclaimedCount: number;
  duplicateCount: number;
  skippedCount: number;
}

/**
 * Match till statement rows against parent payment claims.
 *
 * Rules (see requirement 4):
 * - MATCHED (auto-approve): transaction ID and amount are both equal and the
 *   sender phone is one of the phones saved for that parent.
 * - NEEDS REVIEW: transaction ID matches but the phone differs, the amount
 *   differs, or the claim has no transaction ID. The reason is always stated.
 * - UNCLAIMED: statement rows with no claim.
 * - DUPLICATE: a transaction ID already used (existing statement/payment or
 *   repeated inside the same file).
 * - SKIPPED: outgoing rows or rows with no usable transaction ID.
 */
export function matchRows(
  rows: MatchableRow[],
  claims: PaymentClaim[],
  students: Student[],
  existingTransactionIds: string[] = []
): MatchResult {
  const rowResults: RowMatchResult[] = [];
  const claimResults = new Map<string, ClaimMatchResult>();

  const usedClaimIds = new Set<string>();
  const seenTxns = new Set<string>(existingTransactionIds.map((t) => t.toUpperCase()));

  const openClaims = claims.filter(
    (c) => c.status === 'PENDING' || c.status === 'NEEDS_REVIEW' || c.status === 'NOT_FOUND'
  );

  for (const claim of openClaims) {
    if (!claim.transactionId) {
      claimResults.set(claim.id, {
        claimId: claim.id,
        status: 'NEEDS_REVIEW',
        reason: 'Claim has no transaction ID. / Hakuna namba ya muamala.',
      });
    }
  }

  let exactCount = 0;
  let needsReviewCount = 0;
  let unclaimedCount = 0;
  let duplicateCount = 0;
  let skippedCount = 0;

  rows.forEach((row, index) => {
    const txn = (row.transactionId || '').trim().toUpperCase();

    if (row.direction === 'OUT') {
      skippedCount++;
      rowResults.push({
        row, rowNumber: index + 1, status: 'SKIPPED',
        reason: 'Outgoing payment / Malipo yanayotoka',
      });
      return;
    }
    if (!txn || row.amount <= 0) {
      skippedCount++;
      rowResults.push({
        row, rowNumber: index + 1, status: 'SKIPPED',
        reason: 'Missing transaction ID or invalid amount',
      });
      return;
    }
    if (seenTxns.has(txn)) {
      duplicateCount++;
      rowResults.push({
        row, rowNumber: index + 1, status: 'DUPLICATE',
        reason: `Transaction ID ${txn} already imported or already paid`,
      });
      return;
    }
    seenTxns.add(txn);

    const claim = openClaims.find(
      (c) =>
        !usedClaimIds.has(c.id) &&
        c.transactionId &&
        c.transactionId.trim().toUpperCase() === txn
    );

    if (!claim) {
      unclaimedCount++;
      rowResults.push({ row, rowNumber: index + 1, status: 'UNCLAIMED' });
      return;
    }

    const student = students.find((s) => s.id === claim.studentId);
    const phones = student ? phonesForParent(student, students, claims) : [];
    const sender = normalizePhone(row.senderPhone);
    const phoneOk = sender !== '' && phones.includes(sender);
    const amountOk = Math.round(row.amount) === Math.round(claim.amount);

    usedClaimIds.add(claim.id);

    if (phoneOk && amountOk) {
      exactCount++;
      rowResults.push({
        row, rowNumber: index + 1, status: 'MATCHED',
        claimId: claim.id, studentId: claim.studentId, matchType: 'EXACT',
      });
      claimResults.set(claim.id, {
        claimId: claim.id, status: 'MATCHED', matchType: 'EXACT', rowNumber: index + 1,
      });
      return;
    }

    needsReviewCount++;
    const problems: string[] = [];
    if (!amountOk) {
      problems.push(
        `Amount differs: statement ${row.amount.toLocaleString('en-US')} Tsh vs claim ${claim.amount.toLocaleString('en-US')} Tsh`
      );
    }
    if (!phoneOk) {
      problems.push(
        `Payer phone ${row.senderPhone || '(none)'} does not match any phone saved for this parent (${phones.join(', ') || 'none'})`
      );
    }
    const matchType: MatchType =
      !phoneOk && !amountOk ? 'AMOUNT_PHONE_MISMATCH' : !phoneOk ? 'PHONE_MISMATCH' : 'AMOUNT_MISMATCH';

    rowResults.push({
      row, rowNumber: index + 1, status: 'MATCHED',
      claimId: claim.id, studentId: claim.studentId, matchType,
      reason: problems.join('; '),
    });
    claimResults.set(claim.id, {
      claimId: claim.id, status: 'NEEDS_REVIEW', matchType,
      reason: problems.join('; '), rowNumber: index + 1,
    });
  });

  for (const claim of openClaims) {
    if (claim.transactionId && !claimResults.has(claim.id)) {
      claimResults.set(claim.id, { claimId: claim.id, status: 'UNMATCHED' });
    }
  }

  return {
    rows: rowResults,
    claims: [...claimResults.values()],
    exactCount,
    needsReviewCount,
    unclaimedCount,
    duplicateCount,
    skippedCount,
  };
}

/** Build the payload the backend needs to apply a match result on import. */
export function toImportMatches(result: MatchResult): Array<{
  transaction_id: string;
  claim_id: string;
  match_type: string;
  reason: string;
}> {
  return result.rows
    .filter((r) => r.status === 'MATCHED' && r.claimId && r.matchType)
    .map((r) => ({
      transaction_id: r.row.transactionId.trim().toUpperCase(),
      claim_id: r.claimId!,
      match_type: r.matchType!,
      reason: r.reason || '',
    }));
}

/** Convert API (snake_case) statement rows into matchable rows. */
export function toMatchableRow(row: StatementRow): MatchableRow {
  return {
    transactionId: row.transactionId,
    date: row.date,
    amount: row.amount,
    senderPhone: row.senderPhone,
    senderName: row.senderName,
    receiverTill: row.receiverTill,
    direction: row.direction,
  };
}

/**
 * Claims with no statement row after `days` days become NOT_FOUND;
 * NOT_FOUND claims that now have a row come back as NEEDS_REVIEW.
 * `now` is injectable for tests.
 */
export function findNotFoundClaims(
  claims: PaymentClaim[],
  statementRows: StatementRow[],
  days: number = NOT_FOUND_DEFAULT_DAYS,
  now: Date = new Date()
): { notFound: PaymentClaim[]; restored: PaymentClaim[] } {
  const rowsByClaim = new Map<string, StatementRow[]>();
  for (const row of statementRows) {
    if (!row.claimId) continue;
    if (row.status === 'DUPLICATE' || row.status === 'SKIPPED') continue;
    const list = rowsByClaim.get(row.claimId) || [];
    list.push(row);
    rowsByClaim.set(row.claimId, list);
  }

  const notFound: PaymentClaim[] = [];
  const restored: PaymentClaim[] = [];
  const cutoff = now.getTime() - days * 24 * 60 * 60 * 1000;

  for (const claim of claims) {
    const hasRow = (rowsByClaim.get(claim.id) || []).length > 0;
    if (
      (claim.status === 'PENDING' || claim.status === 'NEEDS_REVIEW') &&
      !hasRow &&
      new Date(claim.submittedAt).getTime() <= cutoff
    ) {
      notFound.push(claim);
    } else if (claim.status === 'NOT_FOUND' && hasRow) {
      restored.push(claim);
    }
  }
  return { notFound, restored };
}

export function claimStatusLabel(status: ClaimStatus): string {
  switch (status) {
    case 'PENDING': return 'Pending';
    case 'NEEDS_REVIEW': return 'Needs review';
    case 'APPROVED': return 'Approved';
    case 'REJECTED': return 'Rejected';
    case 'NOT_FOUND': return 'Not found';
    default: return status;
  }
}

export function claimStatusSwahili(status: ClaimStatus): string {
  switch (status) {
    case 'PENDING': return 'Inasubiri';
    case 'NEEDS_REVIEW': return 'Inahitaji kukaguliwa';
    case 'APPROVED': return 'Imekubaliwa';
    case 'REJECTED': return 'Imekataliwa';
    case 'NOT_FOUND': return 'Haipatikani';
    default: return '';
  }
}
