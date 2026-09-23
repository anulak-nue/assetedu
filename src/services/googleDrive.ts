import { getAccessToken } from './googleAuth';

export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  webViewLink?: string;
  iconLink?: string;
  size?: string;
  owners?: { displayName: string; emailAddress: string }[];
}

async function getAuthHeader(): Promise<HeadersInit> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('กรุณาลงชื่อเข้าใช้ด้วย Google ก่อนใช้งาน Google Drive');
  }
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

/**
 * List files in user's Google Drive matching specific search queries
 */
export async function listDriveFiles(options?: {
  mimeType?: string;
  searchTerm?: string;
  pageSize?: number;
}): Promise<DriveFileItem[]> {
  const headers = await getAuthHeader();
  const pageSize = options?.pageSize || 30;

  const queries: string[] = ['trashed = false'];

  if (options?.mimeType) {
    queries.push(`mimeType = '${options.mimeType}'`);
  }

  if (options?.searchTerm && options.searchTerm.trim()) {
    const escaped = options.searchTerm.replace(/'/g, "\\'");
    queries.push(`name contains '${escaped}'`);
  }

  const q = encodeURIComponent(queries.join(' and '));
  const fields = encodeURIComponent('files(id, name, mimeType, modifiedTime, webViewLink, iconLink, size, owners)');
  const url = `https://www.googleapis.com/drive/v3/files?q=${q}&fields=${fields}&pageSize=${pageSize}&orderBy=modifiedTime desc`;

  const res = await fetch(url, { headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Google Drive Error: ${res.status}`);
  }

  const data = await res.json();
  return (data.files as DriveFileItem[]) || [];
}

/**
 * List Google Spreadsheets from Google Drive
 */
export async function listGoogleSpreadsheets(searchTerm?: string): Promise<DriveFileItem[]> {
  return listDriveFiles({
    mimeType: 'application/vnd.google-apps.spreadsheet',
    searchTerm,
    pageSize: 40,
  });
}

/**
 * Create a backup file or text file in Google Drive (Multipart upload)
 */
export async function uploadTextFileToDrive(options: {
  filename: string;
  content: string;
  mimeType: string;
  description?: string;
}): Promise<DriveFileItem> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('กรุณาลงชื่อเข้าใช้ด้วย Google ก่อนใช้งาน Google Drive');
  }

  const metadata = {
    name: options.filename,
    mimeType: options.mimeType,
    description: options.description || 'ไฟล์สำรองข้อมูลจากระบบตรวจสอบพัสดุประจำปี',
  };

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    `Content-Type: ${options.mimeType}; charset=UTF-8\r\n\r\n` +
    options.content +
    closeDelimiter;

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink,modifiedTime',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to upload file to Google Drive: ${res.status}`);
  }

  return await res.json();
}

/**
 * Get file details by fileId
 */
export async function getDriveFile(fileId: string): Promise<DriveFileItem> {
  const headers = await getAuthHeader();
  const fields = encodeURIComponent('id, name, mimeType, modifiedTime, webViewLink, iconLink, size, owners');
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=${fields}`, {
    headers,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to fetch file from Google Drive: ${res.status}`);
  }

  return await res.json();
}
