import React, { useState, useCallback, useMemo } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, Download, ChevronRight, ChevronLeft } from 'lucide-react';
import { CsvMapping, CsvMappingField } from '../types';
import { formatTsh } from '../config/schoolConfig';
import {
  extractHeaders, suggestMapping, parseStatementCsv, hashText,
  REQUIRED_MAPPING_FIELDS, OPTIONAL_MAPPING_FIELDS, ParsedStatementRow,
} from '../lib/csvParser';
import { matchRows, toImportMatches, MatchResult, MatchableRow } from '../lib/matching';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { authService } from '../services/auth';

interface CSVUploadProps {
  className?: string;
}

type Step = 'upload' | 'mapping' | 'review' | 'done';

const EMPTY_MAPPING: CsvMapping = {};

export const CSVUpload: React.FC<CSVUploadProps> = ({ className = '' }) => {
  const { claims, students, statementImports, importStatement, settings } = useApp();

  const [step, setStep] = useState<Step>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fileName, setFileName] = useState('');
  const [fileText, setFileText] = useState('');
  const [fileHash, setFileHash] = useState('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<CsvMapping>(EMPTY_MAPPING);
  const [showOptional, setShowOptional] = useState(false);

  const [parsed, setParsed] = useState<ParsedStatementRow[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [showSkipped, setShowSkipped] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importSummary, setImportSummary] = useState<{ imported: number; skipped: number; payments: number; claims: number } | null>(null);

  const reset = () => {
    setStep('upload');
    setError(null);
    setFileName('');
    setFileText('');
    setFileHash('');
    setHeaders([]);
    setMapping(EMPTY_MAPPING);
    setParsed([]);
    setParseErrors([]);
    setMatchResult(null);
    setImportSummary(null);
  };

  const handleFile = useCallback((file: File) => {
    if (!file.name.endsWith('.csv')) {
      setError('Please select a CSV file. / Tafadhali chagua faili la CSV.');
      return;
    }
    setProcessing(true);
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = (e.target?.result as string) || '';
      const hdrs = extractHeaders(text);
      if (hdrs.length === 0) {
        setError('The file appears to be empty. / Faili hilo ionekana tupu.');
        setProcessing(false);
        return;
      }
      setFileName(file.name);
      setFileText(text);
      setFileHash(hashText(text));
      setHeaders(hdrs);
      setMapping({ ...suggestMapping(hdrs), ...(settings.csvMapping || {}) });
      setShowOptional(Object.values(settings.csvMapping || {}).some((v) => OPTIONAL_MAPPING_FIELDS.some((f) => f.label === v)));
      setStep('mapping');
      setProcessing(false);
    };
    reader.onerror = () => {
      setError('Failed to read the file. / Imeshindwa kusoma faili.');
      setProcessing(false);
    };
    reader.readAsText(file);
  }, [settings.csvMapping]);

  const mappingValid = useMemo(
    () => REQUIRED_MAPPING_FIELDS.every((f) => mapping[f.field]),
    [mapping]
  );

  const runMatch = async (rows: ParsedStatementRow[]) => {
    let existingTxnIds: string[] = [];
    try {
      existingTxnIds = await api.statements.txnIds();
    } catch {
      existingTxnIds = [];
    }
    const matchable: MatchableRow[] = rows.map((r) => ({
      transactionId: r.transactionId,
      date: r.date,
      amount: r.amount,
      senderPhone: r.senderPhone,
      senderName: r.senderName,
      receiverTill: r.receiverTill,
      direction: r.direction,
    }));
    return matchRows(matchable, claims, students, existingTxnIds);
  };

  const handleParse = async () => {
    if (!mappingValid) {
      setError('Map all required columns before continuing. / Jaza safu zote zinazohitajika.');
      return;
    }
    setProcessing(true);
    setError(null);
    const result = parseStatementCsv(fileText, mapping);
    setParsed(result.rows);
    setParseErrors(result.errors);
    if (result.rows.length === 0) {
      setError(result.errors[0] || 'No valid rows found. / Hakuna safu zinazotambulika.');
      setProcessing(false);
      return;
    }
    setMatchResult(await runMatch(result.rows));
    setStep('review');
    setProcessing(false);
  };

  const handleImport = async () => {
    if (parsed.length === 0) return;
    setImporting(true);
    setError(null);
    try {
      const payloadRows = parsed.map((r) => ({
        transaction_id: r.transactionId,
        date: r.date,
        amount: r.amount,
        sender_phone: r.senderPhone,
        sender_name: r.senderName,
        receiver_till: r.receiverTill,
        direction: r.direction,
      }));
      const res = await importStatement({
        fileName,
        fileHash,
        mapping,
        uploadedBy: authService.getUser()?.username || 'accountant',
        rows: payloadRows,
        matches: matchResult ? toImportMatches(matchResult) : [],
      });
      setImportSummary({
        imported: res.importedRows,
        skipped: res.skippedRows,
        payments: res.payments.length,
        claims: matchResult?.exactCount || 0,
      });
      setStep('done');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import failed. / Imeshindwa kuingiza.');
    } finally {
      setImporting(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false);
    if (e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0]);
  };

  const downloadTemplate = () => {
    const csv =
      'Transaction ID,Date,Amount,Sender Phone,Sender Name,Receiver Till,Type\n' +
      '"MP260110091","2026-01-10",150000,"0778407818","BI MWANAISHA ALI","TILL123456","IN"\n' +
      '"MP260110092","2026-01-10",50000,"0778407818","BI MWANAISHA ALI","TILL123456","OUT"\n' +
      '"MX260111452","2026-01-11",1175000,"0682987654","MZEE HAJI OMAR","TILL123456","IN"';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'statement-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const reviewSummary = matchResult ? {
    exact: matchResult.exactCount,
    review: matchResult.needsReviewCount,
    unclaimed: matchResult.unclaimedCount,
    duplicate: matchResult.duplicateCount,
    skipped: matchResult.skippedCount,
  } : null;

  const rowsByStatus = (status: string) =>
    matchResult?.rows.filter((r) => r.status === status) || [];

  return (
    <div className={`bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden ${className}`}>
      <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700">
            <Upload className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Lipa Namba Statement Import</h3>
            <p className="text-xs text-slate-500">Upload till statement CSV and match it against parent claims</p>
          </div>
        </div>
        <button onClick={downloadTemplate} className="px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1.5">
          <Download className="w-3.5 h-3.5" />
          Template
        </button>
      </div>

      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="p-4">
        {step === 'upload' && (
          <div className="space-y-4">
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${isDragging ? 'border-[#7c3aed] bg-purple-50/50' : 'border-slate-300'}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                type="file"
                accept=".csv"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                className="hidden"
                id="csv-upload"
                disabled={processing}
              />
              <label htmlFor="csv-upload" className="cursor-pointer">
                <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <p className="text-sm font-medium text-slate-700">Drag & drop CSV file or click to browse</p>
                <p className="text-xs text-slate-500 mt-1">Lipa Namba till statement export (CSV format) / Taarifa ya Lipa Namba</p>
              </label>
              {processing && <div className="mt-3 text-sm text-blue-600">Processing file...</div>}
            </div>

            {statementImports.length > 0 && (
              <div className="text-xs text-slate-500">
                {statementImports.length} previous import(s). See the History tab below.
              </div>
            )}
          </div>
        )}

        {step === 'mapping' && (
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-bold text-slate-900">Map CSV Columns</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                <span className="font-mono">{fileName}</span> — tell the importer which column holds each field. /
                Onyesha safu kwa kila sehemu.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {REQUIRED_MAPPING_FIELDS.map((f) => (
                <MappingSelect
                  key={f.field}
                  label={f.label}
                  hint={f.hint}
                  required
                  value={mapping[f.field]}
                  headers={headers}
                  onChange={(v) => setMapping((m) => ({ ...m, [f.field]: v }))}
                />
              ))}
            </div>

            <button
              onClick={() => setShowOptional((s) => !s)}
              className="text-xs font-semibold text-[#7c3aed] hover:underline flex items-center gap-1"
            >
              {showOptional ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              {showOptional ? 'Hide' : 'Show'} optional columns (sender name, till, direction)
            </button>

            {showOptional && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {OPTIONAL_MAPPING_FIELDS.map((f) => (
                  <MappingSelect
                    key={f.field}
                    label={f.label}
                    hint={f.hint}
                    value={mapping[f.field]}
                    headers={headers}
                    onChange={(v) => setMapping((m) => ({ ...m, [f.field]: v }))}
                  />
                ))}
              </div>
            )}

            <div className="flex justify-between pt-2 border-t border-slate-200">
              <button onClick={reset} className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50">
                Cancel
              </button>
              <button
                onClick={handleParse}
                disabled={!mappingValid || processing}
                className="px-4 py-2 bg-[#7c3aed] text-white rounded-lg text-sm font-semibold hover:bg-[#6d28d9] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? 'Parsing...' : 'Continue to matching'}
              </button>
            </div>
          </div>
        )}

        {step === 'review' && matchResult && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Match Preview</h4>
                <p className="text-xs text-slate-500">{parsed.length} row(s) parsed from <span className="font-mono">{fileName}</span></p>
              </div>
              {reviewSummary && (
                <div className="flex flex-wrap gap-3 text-xs text-slate-600">
                  <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> {reviewSummary.exact} auto-approve</span>
                  <span className="flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5 text-amber-600" /> {reviewSummary.review} needs review</span>
                  <span>{reviewSummary.unclaimed} unclaimed</span>
                  <span>{reviewSummary.duplicate} duplicate</span>
                  <span>{reviewSummary.skipped} skipped</span>
                </div>
              )}
            </div>

            {parseErrors.length > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs">
                <strong>{parseErrors.length} row issue(s):</strong>
                <ul className="mt-1 list-disc list-inside">
                  {parseErrors.slice(0, 5).map((err, i) => <li key={i}>{err}</li>)}
                  {parseErrors.length > 5 && <li>...and {parseErrors.length - 5} more</li>}
                </ul>
              </div>
            )}

            {matchResult.exactCount > 0 && (
              <MatchGroup
                tone="emerald"
                title={`Exact matches — will be approved and allocated automatically (${matchResult.exactCount})`}
                rows={matchResult.rows.filter((r) => r.status === 'MATCHED' && r.matchType === 'EXACT')}
                claimsById={claims}
              />
            )}

            {matchResult.needsReviewCount > 0 && (
              <MatchGroup
                tone="amber"
                title={`Linked but needs review — payment will NOT be allocated until approved (${matchResult.needsReviewCount})`}
                rows={matchResult.rows.filter((r) => r.status === 'MATCHED' && r.matchType !== 'EXACT')}
                claimsById={claims}
                showReason
              />
            )}

            {matchResult.unclaimedCount > 0 && (
              <MatchGroup
                tone="blue"
                title={`Unclaimed money — no matching claim, assignable later (${matchResult.unclaimedCount})`}
                rows={rowsByStatus('UNCLAIMED')}
                claimsById={claims}
              />
            )}

            {(matchResult.duplicateCount > 0 || matchResult.skippedCount > 0) && (
              <div>
                <button
                  onClick={() => setShowSkipped((s) => !s)}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-700 flex items-center gap-1 mb-2"
                >
                  {showSkipped ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  {showSkipped ? 'Hide' : 'Show'} duplicate &amp; skipped rows ({matchResult.duplicateCount + matchResult.skippedCount})
                </button>
                {showSkipped && (
                  <MatchGroup
                    tone="slate"
                    title="Duplicates & skipped"
                    rows={[...rowsByStatus('DUPLICATE'), ...rowsByStatus('SKIPPED')]}
                    claimsById={claims}
                    showReason
                  />
                )}
              </div>
            )}

            <div className="flex justify-between pt-2 border-t border-slate-200">
              <button onClick={() => setStep('mapping')} className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1">
                <ChevronLeft className="w-3.5 h-3.5" /> Back to mapping
              </button>
              <button
                onClick={handleImport}
                disabled={importing || parsed.length === 0}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {importing ? 'Importing...' : `Import ${parsed.length} row(s)`}
              </button>
            </div>
          </div>
        )}

        {step === 'done' && importSummary && (
          <div className="text-center py-6 space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <div>
              <h4 className="text-base font-bold text-slate-900">Import Complete</h4>
              <p className="text-xs text-slate-500 mt-1">
                {importSummary.imported} row(s) imported, {importSummary.skipped} skipped (duplicate/outgoing).
              </p>
              <p className="text-xs text-slate-500">
                {importSummary.payments} payment(s) created and allocated; {importSummary.claims} claim(s) auto-approved.
              </p>
            </div>
            <button onClick={reset} className="px-4 py-2 bg-[#7c3aed] text-white rounded-lg text-sm font-semibold hover:bg-[#6d28d9]">
              Import another statement
            </button>
          </div>
        )}

        {statementImports.length > 0 && (
          <div className="mt-6 pt-4 border-t border-slate-200">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">Import History</h4>
            <div className="overflow-x-auto max-h-64 overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="sticky top-0 bg-white">
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">File</th>
                    <th className="px-3 py-2">Rows</th>
                    <th className="px-3 py-2">Imported</th>
                    <th className="px-3 py-2">Skipped</th>
                    <th className="px-3 py-2">Claims</th>
                    <th className="px-3 py-2">By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {statementImports.map((imp) => (
                    <tr key={imp.id} className="hover:bg-slate-50/70">
                      <td className="px-3 py-2 font-mono text-slate-700">{new Date(imp.uploadedAt).toLocaleString()}</td>
                      <td className="px-3 py-2 text-slate-900 truncate max-w-[180px]" title={imp.fileName}>{imp.fileName}</td>
                      <td className="px-3 py-2 text-slate-700">{imp.totalRows}</td>
                      <td className="px-3 py-2 font-semibold text-emerald-700">{imp.importedRows}</td>
                      <td className="px-3 py-2 font-semibold text-amber-700">{imp.skippedRows}</td>
                      <td className="px-3 py-2 font-semibold text-[#7c3aed]">{imp.matchedClaims}</td>
                      <td className="px-3 py-2 text-slate-500">{imp.uploadedBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const MappingSelect: React.FC<{
  label: string; hint: string; required?: boolean; value?: string; headers: string[];
  onChange: (v: string | undefined) => void;
}> = ({ label, hint, required, value, headers, onChange }) => (
  <div>
    <label className="block text-xs font-semibold text-slate-700 mb-1">
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
      <span className="block text-[10px] font-normal text-slate-400">{hint}</span>
    </label>
    <select
      value={value || ''}
      onChange={(e) => onChange(e.target.value || undefined)}
      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/30"
    >
      <option value="">— select column —</option>
      {headers.map((h) => (
        <option key={h} value={h}>{h}</option>
      ))}
    </select>
  </div>
);

const MatchGroup: React.FC<{
  tone: 'emerald' | 'amber' | 'blue' | 'slate';
  title: string;
  rows: Array<{ row: MatchableRow; rowNumber: number; status: string; claimId?: string; studentId?: string; matchType?: string; reason?: string }>;
  claimsById: Array<{ id: string; studentId: string; payerPhone: string; amount: number; transactionId: string; status: string }>;
  showReason?: boolean;
}> = ({ tone, title, rows, claimsById, showReason }) => {
  if (rows.length === 0) return null;
  const tones = {
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    amber: 'bg-amber-50 border-amber-200 text-amber-900',
    blue: 'bg-blue-50 border-blue-200 text-blue-900',
    slate: 'bg-slate-50 border-slate-200 text-slate-700',
  } as const;
  return (
    <div className={`border rounded-lg p-3 ${tones[tone]}`}>
      <h5 className="text-xs font-bold mb-2">{title}</h5>
      <div className="space-y-1 max-h-56 overflow-y-auto">
        {rows.map((r, i) => {
          const claim = r.claimId ? claimsById.find((c) => c.id === r.claimId) : undefined;
          return (
            <div key={i} className="flex items-center justify-between gap-2 text-xs py-1 px-2 bg-white rounded border border-slate-100">
              <div className="flex flex-wrap items-center gap-2 min-w-0">
                {r.matchType && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-slate-100 text-slate-600">{r.matchType}</span>
                )}
                <span className="font-mono">{formatTsh(r.row.amount)}</span>
                <span className="font-mono text-[#7c3aed]">{r.row.transactionId}</span>
                <span className="text-slate-500">{r.row.senderPhone}</span>
                <span className="text-slate-400">{r.row.date}</span>
                {claim && <span className="text-slate-400">claim: {claim.studentId}</span>}
              </div>
              {showReason && r.reason && (
                <span className="text-[10px] text-slate-500 text-right shrink-0 max-w-[45%]">{r.reason}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
