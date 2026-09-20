/**
 * Google Drive backup sync, via Google Identity Services (GIS) + the Drive
 * REST API directly — no vendor SDK, plain fetch, so there is no ambient
 * credential to fight with.
 *
 * This needs a Google OAuth Client ID for the app itself (one client ID
 * covers every subscriber — each of them just signs in with their own
 * Google account and authorizes AskNameAI). That ID is a public value, not
 * a secret, but someone with access to a Google Cloud project has to create
 * it once: console.cloud.google.com -> APIs & Services -> Credentials ->
 * OAuth client ID -> Web application, with this app's origin under
 * "Authorized JavaScript origins". Set it as VITE_GOOGLE_CLIENT_ID in .env
 * and everything below activates — nothing else changes.
 *
 * The Drive scope is drive.file: the app can only see files it creates
 * itself, never a subscriber's other Drive contents.
 */

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (resp: { access_token?: string; expires_in?: number; error?: string }) => void;
          }) => { requestAccessToken: (opts?: { prompt?: string }) => void };
          revoke: (token: string, done: () => void) => void;
        };
      };
    };
  }
}

const CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined) || '';
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
const GIS_SRC = 'https://accounts.google.com/gsi/client';
const BACKUP_FOLDER_NAME = 'AskNameAI Backups';

export const isDriveConfigured = (): boolean => CLIENT_ID.length > 0;

// Held outside React so a component unmount (tab switch) never loses the
// live session token mid-upload.
let cachedToken: { token: string; expiresAt: number } | null = null;
let gisLoadPromise: Promise<void> | null = null;

function loadGis(): Promise<void> {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (gisLoadPromise) return gisLoadPromise;
  gisLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = GIS_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Could not load Google Sign-In — check your connection and try again.'));
    document.head.appendChild(script);
  });
  return gisLoadPromise;
}

export function isDriveConnected(): boolean {
  return !!cachedToken && cachedToken.expiresAt > Date.now();
}

export async function connectGoogleDrive(): Promise<{ success: boolean; error?: string }> {
  if (!isDriveConfigured()) {
    return { success: false, error: 'Google Drive sync has not been turned on for this app yet.' };
  }
  try {
    await loadGis();
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Could not load Google Sign-In.' };
  }

  return new Promise((resolve) => {
    const client = window.google!.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: DRIVE_SCOPE,
      callback: (resp) => {
        if (resp.error || !resp.access_token) {
          resolve({ success: false, error: `Google did not grant access${resp.error ? `: ${resp.error}` : '.'}` });
          return;
        }
        cachedToken = { token: resp.access_token, expiresAt: Date.now() + (resp.expires_in || 3600) * 1000 - 30_000 };
        resolve({ success: true });
      },
    });
    client.requestAccessToken();
  });
}

export function disconnectGoogleDrive(): void {
  if (cachedToken) {
    window.google?.accounts?.oauth2?.revoke(cachedToken.token, () => {});
  }
  cachedToken = null;
}

async function driveApi(path: string, token: string, init?: RequestInit): Promise<Response> {
  return fetch(`https://www.googleapis.com/drive/v3/${path}`, {
    ...init,
    credentials: 'omit',
    headers: { ...(init?.headers || {}), Authorization: `Bearer ${token}` },
  });
}

async function ensureBackupFolder(token: string): Promise<string> {
  const q = encodeURIComponent(`mimeType='application/vnd.google-apps.folder' and name='${BACKUP_FOLDER_NAME}' and trashed=false`);
  const listRes = await driveApi(`files?q=${q}&fields=files(id,name)`, token);
  const listData = await listRes.json();
  if (listData.files?.length > 0) return listData.files[0].id;

  const createRes = await driveApi('files', token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: BACKUP_FOLDER_NAME, mimeType: 'application/vnd.google-apps.folder' }),
  });
  const created = await createRes.json();
  return created.id;
}

export interface DriveUploadResult {
  success: boolean;
  folderId?: string;
  error?: string;
}

/** Uploads one file into the subscriber's own "AskNameAI Backups" Drive folder. */
export async function uploadToDrive(filename: string, content: string, mimeType: string): Promise<DriveUploadResult> {
  if (!isDriveConnected()) {
    return { success: false, error: 'Not connected to Google Drive — connect first.' };
  }
  const token = cachedToken!.token;
  try {
    const folderId = await ensureBackupFolder(token);
    const boundary = 'asknameai-drive-boundary';
    const metadata = { name: filename, parents: [folderId] };
    const body =
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n` +
      `--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n${content}\r\n--${boundary}--`;

    const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', {
      method: 'POST',
      credentials: 'omit',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': `multipart/related; boundary=${boundary}` },
      body,
    });
    if (!res.ok) {
      const errText = await res.text();
      return { success: false, error: `Drive upload failed (HTTP ${res.status}): ${errText.slice(0, 200)}` };
    }
    return { success: true, folderId };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Upload to Google Drive failed.' };
  }
}

export const driveFolderUrl = (folderId: string) => `https://drive.google.com/drive/folders/${folderId}`;
