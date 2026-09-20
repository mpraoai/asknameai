import React, { useMemo, useRef, useState } from 'react';
import { UploadCloud, FileSpreadsheet, ArrowRight, ArrowLeft, CheckCircle2, AlertTriangle, Loader2, RotateCcw } from 'lucide-react';
import {
  ParsedSheet,
  ColumnMapping,
  ImportFieldKey,
  IMPORT_FIELDS,
  parseImportFile,
  guessMapping,
  mapRows,
  bulkImportLeads,
  ImportResult,
} from '../services/importService';
import { Lead } from '../services/numerologistService';

interface ImportLeadsPanelProps {
  numerologistId: string;
  existingLeads: Lead[];
  onImported: () => void;
  onViewLeads: () => void;
}

type Step = 'upload' | 'map' | 'result';

const NO_MAP = '__none__';

export const ImportLeadsPanel: React.FC<ImportLeadsPanelProps> = ({ numerologistId, existingLeads, onImported, onViewLeads }) => {
  const [step, setStep] = useState<Step>('upload');
  const [fileName, setFileName] = useState('');
  const [sheet, setSheet] = useState<ParsedSheet | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [parseError, setParseError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const existingMobiles = useMemo(
    () => new Set(existingLeads.map((l) => l.mobile_number).filter(Boolean) as string[]),
    [existingLeads]
  );

  const handleFile = async (file: File) => {
    setParseError('');
    try {
      const parsed = await parseImportFile(file);
      if (parsed.rows.length === 0) {
        setParseError('That file has no data rows below the header. Check the sheet and try again.');
        return;
      }
      setFileName(file.name);
      setSheet(parsed);
      setMapping(guessMapping(parsed.headers));
      setStep('map');
    } catch (e) {
      setParseError('Could not read that file. Make sure it is a valid .csv or .xlsx export.');
    }
  };

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const allMapped = useMemo(() => {
    if (!sheet) return [];
    return mapRows(sheet.rows, mapping, existingMobiles);
  }, [sheet, mapping, existingMobiles]);

  const previewRows = allMapped.slice(0, 5);
  const duplicateCount = allMapped.filter((r) => r.isDuplicate).length;
  const noContactCount = allMapped.filter((r) => !r.hasContact).length;
  const toImportCount = allMapped.filter((r) => r.hasContact && !(skipDuplicates && r.isDuplicate)).length;
  const firstNameMapped = mapping.first_name !== undefined;

  const handleImport = async () => {
    if (!sheet) return;
    setImporting(true);
    const rowsToSend = skipDuplicates ? allMapped.filter((r) => !r.isDuplicate) : allMapped;
    const res = await bulkImportLeads(numerologistId, rowsToSend);
    setImporting(false);
    setResult(res);
    setStep('result');
    if (res.inserted > 0) onImported();
  };

  const reset = () => {
    setStep('upload');
    setFileName('');
    setSheet(null);
    setMapping({});
    setResult(null);
    setParseError('');
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-sky-400">
      <h2 className="font-semibold text-gray-800 flex items-center gap-2 mb-1">
        <UploadCloud className="w-4 h-4 text-sky-500" />
        Import Leads
      </h2>
      <p className="text-xs text-gray-400 mb-6">
        Bring in your existing client list from Excel or a CSV export before you go live — no need to add them one by one.
      </p>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6 text-xs font-medium">
        {(['upload', 'map', 'result'] as Step[]).map((s, i) => (
          <React.Fragment key={s}>
            {i > 0 && <div className="w-6 h-px bg-gray-200" />}
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${step === s ? 'bg-sky-100 text-sky-700' : 'text-gray-400'}`}>
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${step === s ? 'bg-sky-500 text-white' : 'bg-gray-100'}`}>
                {i + 1}
              </span>
              {s === 'upload' ? 'Upload file' : s === 'map' ? 'Map & preview' : 'Done'}
            </div>
          </React.Fragment>
        ))}
      </div>

      {step === 'upload' && (
        <div
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
          className="border-2 border-dashed border-gray-200 rounded-xl p-10 text-center hover:border-sky-300 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" onChange={onFileInput} className="hidden" />
          <FileSpreadsheet className="w-10 h-10 text-sky-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-700">Drop a .csv or .xlsx file here, or click to browse</p>
          <p className="text-xs text-gray-400 mt-1">Your existing Excel client list or leads export works as-is.</p>
          {parseError && (
            <p className="text-xs text-red-600 mt-3 flex items-center justify-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              {parseError}
            </p>
          )}
        </div>
      )}

      {step === 'map' && sheet && (
        <div className="space-y-6">
          <div className="flex items-center justify-between text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
            <span className="flex items-center gap-1.5"><FileSpreadsheet className="w-3.5 h-3.5" />{fileName}</span>
            <span>{sheet.rows.length} rows detected · {sheet.headers.length} columns</span>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-600 mb-2">Match your columns to AskNameAI fields</p>
            <div className="grid sm:grid-cols-2 gap-3">
              {IMPORT_FIELDS.map((field) => (
                <div key={field.key} className="flex items-center gap-2">
                  <label className="text-xs text-gray-500 w-32 flex-shrink-0 min-w-0 truncate" title={field.label}>
                    {field.label}{field.required && <span className="text-red-500">*</span>}
                  </label>
                  <select
                    value={mapping[field.key as ImportFieldKey] ?? NO_MAP}
                    onChange={(e) => {
                      const val = e.target.value;
                      setMapping((prev) => ({
                        ...prev,
                        [field.key]: val === NO_MAP ? undefined : Number(val),
                      }));
                    }}
                    className="flex-1 text-sm border border-gray-200 rounded-lg px-2 py-1.5 text-gray-900 min-w-0"
                  >
                    <option value={NO_MAP}>— not in file —</option>
                    {sheet.headers.map((h, i) => (
                      <option key={i} value={i}>{h || `Column ${i + 1}`}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
            {!firstNameMapped && (
              <p className="text-xs text-amber-600 mt-2 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                Map a First name column to continue — unmatched rows will import as "Unknown".
              </p>
            )}
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-600 mb-2">Preview — first 5 rows, as they will be saved</p>
            <div className="overflow-x-auto border border-gray-100 rounded-lg">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-gray-400 uppercase bg-gray-50 border-b border-gray-100">
                    <th className="py-2 px-3">Name</th>
                    <th className="py-2 px-3">Mobile</th>
                    <th className="py-2 px-3">Email</th>
                    <th className="py-2 px-3">Channel</th>
                    <th className="py-2 px-3">Score</th>
                    <th className="py-2 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {previewRows.map((r, i) => (
                    <tr key={i} className={!r.hasContact ? 'opacity-50' : ''}>
                      <td className="py-2 px-3 text-gray-800 font-medium min-w-0">{r.first_name} {r.last_name}</td>
                      <td className="py-2 px-3 text-gray-500">{r.mobile_number || '—'}</td>
                      <td className="py-2 px-3 text-gray-500 min-w-0 truncate max-w-[160px]" title={r.email}>{r.email || '—'}</td>
                      <td className="py-2 px-3 text-gray-500 capitalize">{r.channel.replace('_', ' ')}</td>
                      <td className="py-2 px-3 text-gray-500 capitalize">{r.lead_score}</td>
                      <td className="py-2 px-3">
                        {!r.hasContact ? (
                          <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full uppercase">No contact</span>
                        ) : r.isDuplicate ? (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full uppercase">Already have</span>
                        ) : (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full uppercase">New</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {sheet.rows.length > 5 && (
              <p className="text-[11px] text-gray-400 mt-1.5">+ {sheet.rows.length - 5} more rows will import the same way.</p>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50 rounded-lg px-4 py-3">
            <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
              <input type="checkbox" checked={skipDuplicates} onChange={(e) => setSkipDuplicates(e.target.checked)} className="rounded" />
              Skip {duplicateCount} row{duplicateCount === 1 ? '' : 's'} that match a mobile number you already have
            </label>
            <div className="text-xs text-gray-500">
              {noContactCount > 0 && <span className="text-amber-600">{noContactCount} row{noContactCount === 1 ? '' : 's'} have no mobile or email and will be skipped. </span>}
              <b className="text-gray-800">{toImportCount}</b> will import.
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button onClick={reset} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1.5">
              <ArrowLeft className="w-4 h-4" />
              Choose a different file
            </button>
            <button
              onClick={handleImport}
              disabled={importing || toImportCount === 0}
              className="bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg flex items-center gap-2"
            >
              {importing && <Loader2 className="w-4 h-4 animate-spin" />}
              Import {toImportCount} lead{toImportCount === 1 ? '' : 's'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {step === 'result' && result && (
        <div className="text-center py-8 space-y-4">
          {result.error && result.inserted === 0 ? (
            <>
              <AlertTriangle className="w-12 h-12 text-red-400 mx-auto" />
              <p className="font-semibold text-gray-800">Import failed</p>
              <p className="text-sm text-gray-500 max-w-md mx-auto">{result.error}</p>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
              <p className="font-semibold text-gray-800">{result.inserted} lead{result.inserted === 1 ? '' : 's'} imported</p>
              <p className="text-sm text-gray-500">
                {result.skipped > 0 ? `${result.skipped} row${result.skipped === 1 ? '' : 's'} skipped (duplicates or missing contact info).` : 'Everything imported cleanly.'}
              </p>
            </>
          )}
          <div className="flex items-center justify-center gap-3 pt-2">
            <button onClick={reset} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1.5">
              <RotateCcw className="w-4 h-4" />
              Import another file
            </button>
            {result.inserted > 0 && (
              <button onClick={onViewLeads} className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-lg flex items-center gap-2">
                View imported leads
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
