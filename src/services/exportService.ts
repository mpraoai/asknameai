import { getMyLeads, Lead, NumerologistProfile } from './numerologistService';
import { getMyDeals, Deal, getActivitiesForLead } from './crmService';
import { getMyReports, NumerologyReport } from './reportsService';
import { getMyTeam, TeamMember } from './teamService';

/**
 * Data ownership and recovery. Nothing here changes stored data — every
 * function only reads and hands the subscriber a copy of their own records,
 * so they are never locked into AskNameAI and can recover after data loss.
 */

const download = (filename: string, content: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const csvEscape = (value: unknown): string => {
  const s = String(value ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const toCSV = (rows: Record<string, unknown>[]): string => {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((h) => csvEscape(row[h])).join(','));
  }
  return lines.join('\n');
};

const stamp = () => new Date().toISOString().slice(0, 10);

/** Every lead (active pipeline + past customers) as a spreadsheet, for Excel/Sheets/Google Drive. */
export function exportLeadsCSV(leads: Lead[], fileLabel = 'leads') {
  const rows = leads.map((l) => ({
    first_name: l.first_name || '',
    last_name: l.last_name || '',
    mobile_number: l.mobile_number || '',
    email: l.email || '',
    channel: l.channel || '',
    lead_score: l.lead_score,
    status: l.status,
    created_at: l.created_at,
  }));
  download(`asknameai-${fileLabel}-${stamp()}.csv`, toCSV(rows), 'text/csv;charset=utf-8');
}

/** Only converted, paying customers — the list a subscriber re-markets to. */
export function exportCustomersCSV(leads: Lead[]) {
  exportLeadsCSV(leads.filter((l) => l.status === 'converted'), 'customers');
}

export interface FullBackup {
  exportedAt: string;
  version: 1;
  profile: Pick<NumerologistProfile, 'business_name' | 'subscription_status'>;
  leads: Lead[];
  deals: Deal[];
  reports: NumerologyReport[];
  team: TeamMember[];
  activitiesByLeadId: Record<string, unknown[]>;
}

/**
 * The full, provider-independent copy: every lead, deal, report, team member
 * and activity trail. This is the recovery path if data is ever lost or
 * corrupted — restorable by hand, and portable to Google Drive, a local
 * drive, or any other tool. Split from the download trigger below so a
 * Drive upload can reuse the exact same payload instead of rebuilding it.
 */
export async function buildFullBackup(profile: NumerologistProfile): Promise<FullBackup> {
  const [leads, deals, reports, team] = await Promise.all([
    getMyLeads(profile.id),
    getMyDeals(profile.id),
    getMyReports(profile.id),
    getMyTeam(profile.id),
  ]);

  const activitiesByLeadId: Record<string, unknown[]> = {};
  await Promise.all(
    leads.map(async (l) => {
      activitiesByLeadId[l.id] = await getActivitiesForLead(l.id);
    })
  );

  return {
    exportedAt: new Date().toISOString(),
    version: 1,
    profile: { business_name: profile.business_name, subscription_status: profile.subscription_status },
    leads,
    deals,
    reports,
    team,
    activitiesByLeadId,
  };
}

export const backupFilename = () => `asknameai-backup-${stamp()}.json`;

export async function exportFullBackupJSON(profile: NumerologistProfile): Promise<{ success: boolean; error?: string }> {
  try {
    const backup = await buildFullBackup(profile);
    download(backupFilename(), JSON.stringify(backup, null, 2), 'application/json');
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Could not build the backup file.' };
  }
}
