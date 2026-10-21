import { CsvMapping, CsvMappingField } from '../types';

export interface ParsedStatementRow {
  transactionId: string;
  date: string;
  amount: number;
  senderPhone: string;
  senderName: string;
  receiverTill: string;
  direction: 'IN' | 'OUT';
  line: number;
}

export const REQUIRED_MAPPING_FIELDS: Array<{ field: CsvMappingField; label: string; hint: string }> = [
  { field: 'transactionId', label: 'Transaction ID', hint: 'Namba ya Muamala' },
  { field: 'date', label: 'Payment Date', hint: 'Tarehe ya Malipo' },
  { field: 'amount', label: 'Amount', hint: 'Kiasi' },
  { field: 'senderPhone', label: 'Sender Phone', hint: 'Simu ya Mtumaji' },
];

export const OPTIONAL_MAPPING_FIELDS: Array<{ field: CsvMappingField; label: string; hint: string }> = [
  { field: 'senderName', label: 'Sender Name', hint: 'Jina la Mtumaji' },
  { field: 'receiverTill', label: 'Receiver Till / Paybill', hint: 'Till ya Mpokeaji' },
  { field: 'direction', label: 'Direction / Type', hint: 'Aina (In/Out)' },
];

export function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result.map((c) => c.trim());
}

export function extractHeaders(csvText: string): string[] {
  const firstLine = csvText.split(/\r?\n/).find((l) => l.trim().length > 0);
  if (!firstLine) return [];
  return parseCsvLine(firstLine);
}

/**
 * Guess a column mapping from the header row. Used only to prefill the
 * mapping step — every network's export can differ, so the user can change it.
 */
export function suggestMapping(headers: string[]): CsvMapping {
  const mapping: CsvMapping = {};
  const lower = headers.map((h) => h.toLowerCase());
  const used = new Set<number>();

  const find = (tests: RegExp[]): number | undefined => {
    for (let i = 0; i < lower.length; i++) {
      if (used.has(i)) continue;
      if (tests.some((t) => t.test(lower[i]))) {
        used.add(i);
        return i;
      }
    }
    return undefined;
  };

  const colName = (i: number | undefined) => (i === undefined ? undefined : headers[i]);

  mapping.transactionId = colName(
    find([/transaction/, /\btxn\b/, /\bref(erence)?\b/, /\bno\.?\b.*\bid\b/, /^id$/])
  );
  mapping.date = colName(find([/date/, /time/, /tarehe/]));
  mapping.amount = colName(find([/amount/, /value/, /kiasi/, /\bsum\b/, /credit/]));
  mapping.senderPhone = colName(
    find([/sender.*phone/, /phone/, /msisdn/, /payer/, /mpesa.*no/, /from.*no/, /simu/])
  );
  mapping.senderName = colName(find([/sender.*name/, /name/, /jina/, /customer/]));
  mapping.receiverTill = colName(find([/receiver/, /till/, /paybill/, /merchant/, /mpesa.*pay/]));
  mapping.direction = colName(find([/direction/, /\btype\b/, /\bdesc/, /nature/, /in\/out/]));

  return mapping;
}

/** FNV-1a hash used to detect re-importing the exact same file. */
export function hashText(text: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 16777619) >>> 0;
    h2 = Math.imul(h2 + c + i, 2246822519) >>> 0;
  }
  return h1.toString(16).padStart(8, '0') + h2.toString(16).padStart(8, '0');
}

function parseAmount(raw: string): { value: number; negative: boolean } {
  let s = (raw || '').trim();
  let negative = false;
  if (/^\(.*\)$/.test(s)) {
    negative = true;
    s = s.slice(1, -1);
  }
  s = s.replace(/[^\d.,\-]/g, '').replace(/,/g, '');
  if (s.startsWith('-')) {
    negative = true;
    s = s.slice(1);
  }
  const value = parseFloat(s);
  if (isNaN(value)) return { value: NaN, negative };
  return { value: Math.round(value), negative };
}

function parseDate(raw: string): string | null {
  const s = (raw || '').trim();
  if (!s) return null;

  // YYYY-MM-DD (optionally with time)
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  // DD/MM/YYYY or DD-MM-YYYY (common in TZ exports)
  const dmy = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/);
  if (dmy) {
    let [, d, m, y] = dmy;
    if (y.length === 2) y = `20${y}`;
    const dd = d.padStart(2, '0');
    const mm = m.padStart(2, '0');
    if (+mm <= 12 && +dd <= 31) return `${y}-${mm}-${dd}`;
  }

  const parsed = new Date(s);
  if (!isNaN(parsed.getTime())) return parsed.toISOString().split('T')[0];
  return null;
}

/**
 * Parse a till/merchant statement CSV using an explicit column mapping.
 * Rows that cannot be parsed are reported in `errors` with their line number.
 */
export function parseStatementCsv(
  csvText: string,
  mapping: CsvMapping
): { rows: ParsedStatementRow[]; errors: string[] } {
  const errors: string[] = [];
  const rows: ParsedStatementRow[] = [];

  const missing = REQUIRED_MAPPING_FIELDS.filter((f) => !mapping[f.field]).map((f) => f.label);
  if (missing.length > 0) {
    return { rows, errors: [`Mapping is missing required columns: ${missing.join(', ')}`] };
  }

  const lines = csvText.split(/\r?\n/);
  const headerLine = lines.findIndex((l) => l.trim().length > 0);
  if (headerLine === -1) return { rows, errors: ['CSV file is empty'] };

  const headerCols = parseCsvLine(lines[headerLine]);
  const indexFor = (header?: string): number =>
    header === undefined ? -1 : headerCols.findIndex((h) => h.toLowerCase() === header.toLowerCase());

  const idx = {
    transactionId: indexFor(mapping.transactionId),
    date: indexFor(mapping.date),
    amount: indexFor(mapping.amount),
    senderPhone: indexFor(mapping.senderPhone),
    senderName: indexFor(mapping.senderName),
    receiverTill: indexFor(mapping.receiverTill),
    direction: indexFor(mapping.direction),
  };

  for (let i = headerLine + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols = parseCsvLine(line);
    const lineNo = i + 1;

    const get = (k: keyof typeof idx) => (idx[k] >= 0 ? cols[idx[k]] || '' : '');

    const transactionId = get('transactionId').replace(/"/g, '').trim().toUpperCase();
    const amountInfo = parseAmount(get('amount'));
    const dateStr = parseDate(get('date'));
    const senderPhone = get('senderPhone').trim();

    if (isNaN(amountInfo.value)) {
      errors.push(`Row ${lineNo}: invalid amount "${get('amount')}"`);
      continue;
    }
    if (!dateStr) {
      errors.push(`Row ${lineNo}: invalid date "${get('date')}"`);
      continue;
    }

    let direction: 'IN' | 'OUT' = amountInfo.negative ? 'OUT' : 'IN';
    const directionRaw = get('direction').toLowerCase();
    if (directionRaw) {
      if (/out|withdraw|sent|to\b|transfer|kutoka/.test(directionRaw)) direction = 'OUT';
      else if (/in|received|from\b|deposit|kuingia/.test(directionRaw)) direction = 'IN';
    }

    rows.push({
      transactionId,
      date: dateStr,
      amount: Math.abs(amountInfo.value),
      senderPhone,
      senderName: get('senderName').trim(),
      receiverTill: get('receiverTill').trim(),
      direction,
      line: lineNo,
    });
  }

  if (rows.length === 0 && errors.length === 0) {
    errors.push('No data rows found in the file');
  }
  return { rows, errors };
}
