import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabase';

export interface ParsedSheet {
  headers: string[];
  rows: string[][];
}

const VALID_CHANNELS = [
  'website', 'youtube', 'instagram', 'facebook', 'linkedin',
  'whatsapp', 'referral', 'existing_customer', 'walk_in', 'organic', 'other',
];
const VALID_SCORES = ['hot', 'warm', 'cold'];

export const IMPORT_FIELDS = [
  { key: 'first_name', label: 'First name', required: true },
  { key: 'last_name', label: 'Last name', required: false },
  { key: 'mobile_number', label: 'Mobile number', required: false },
  { key: 'email', label: 'Email', required: false },
  { key: 'channel', label: 'Channel / source', required: false },
  { key: 'lead_score', label: 'Lead score (hot / warm / cold)', required: false },
] as const;

export type ImportFieldKey = typeof IMPORT_FIELDS[number]['key'];
export type ColumnMapping = Partial<Record<ImportFieldKey, number>>;

/**
 * Parses a .csv or .xlsx file into a plain header row + data rows. xlsx reads
 * CSV natively via the same code path, so one parser covers both formats.
 */
export async function parseImportFile(file: File): Promise<ParsedSheet> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' });

  const headers = (raw[0] || []).map((h) => String(h ?? '').trim());
  const rows = raw
    .slice(1)
    .map((r) => headers.map((_, i) => String((r as unknown[])[i] ?? '').trim()))
    .filter((r) => r.some((cell) => cell !== ''));

  return { headers, rows };
}

/** Best-effort auto-map: matches header text to a field by common aliases. */
export function guessMapping(headers: string[]): ColumnMapping {
  const aliases: Record<ImportFieldKey, string[]> = {
    first_name: ['first name', 'firstname', 'name', 'client name', 'full name'],
    last_name: ['last name', 'lastname', 'surname'],
    mobile_number: ['mobile', 'mobile number', 'phone', 'phone number', 'contact number', 'whatsapp number'],
    email: ['email', 'email id', 'email address'],
    channel: ['channel', 'source', 'lead source'],
    lead_score: ['score', 'lead score', 'quality'],
  };
  const mapping: ColumnMapping = {};
  headers.forEach((header, index) => {
    const normalized = header.trim().toLowerCase();
    (Object.keys(aliases) as ImportFieldKey[]).forEach((key) => {
      if (mapping[key] !== undefined) return;
      if (aliases[key].includes(normalized)) mapping[key] = index;
    });
  });
  return mapping;
}

export interface MappedLeadRow {
  first_name: string;
  last_name: string;
  mobile_number: string;
  email: string;
  channel: string;
  lead_score: 'hot' | 'warm' | 'cold';
  isDuplicate: boolean;
  hasContact: boolean;
}

const normalizeChannel = (raw: string): string => {
  const key = raw.trim().toLowerCase().replace(/[\s-]+/g, '_');
  return VALID_CHANNELS.includes(key) ? key : 'other';
};

const normalizeScore = (raw: string): 'hot' | 'warm' | 'cold' => {
  const key = raw.trim().toLowerCase();
  return (VALID_SCORES as string[]).includes(key) ? (key as 'hot' | 'warm' | 'cold') : 'warm';
};

/** Applies the column mapping to every parsed row and flags duplicates against existing mobile numbers. */
export function mapRows(rows: string[][], mapping: ColumnMapping, existingMobiles: Set<string>): MappedLeadRow[] {
  const get = (row: string[], key: ImportFieldKey) => {
    const idx = mapping[key];
    return idx === undefined ? '' : (row[idx] || '').trim();
  };
  return rows.map((row) => {
    const mobile = get(row, 'mobile_number').replace(/\D/g, '').slice(0, 15);
    const email = get(row, 'email');
    return {
      first_name: get(row, 'first_name') || 'Unknown',
      last_name: get(row, 'last_name'),
      mobile_number: mobile,
      email,
      channel: normalizeChannel(get(row, 'channel')),
      lead_score: normalizeScore(get(row, 'lead_score')),
      isDuplicate: !!mobile && existingMobiles.has(mobile),
      hasContact: !!mobile || !!email,
    };
  });
}

export interface ImportResult {
  inserted: number;
  skipped: number;
  error?: string;
}

export async function bulkImportLeads(
  numerologistId: string,
  leads: MappedLeadRow[]
): Promise<ImportResult> {
  const toInsert = leads.filter((l) => l.hasContact);
  if (toInsert.length === 0) {
    return { inserted: 0, skipped: leads.length, error: 'No rows had a mobile number or email to import.' };
  }

  const records = toInsert.map((l) => ({
    first_name: l.first_name,
    last_name: l.last_name || null,
    mobile_number: l.mobile_number || null,
    email: l.email || null,
    source_type: 'manual' as const,
    channel: l.channel,
    lead_score: l.lead_score,
    assigned_numerologist_id: numerologistId,
  }));

  const { error, count } = await supabase.from('leads').insert(records, { count: 'exact' });
  if (error) {
    return { inserted: 0, skipped: leads.length, error: error.message };
  }
  return { inserted: count ?? records.length, skipped: leads.length - toInsert.length };
}
