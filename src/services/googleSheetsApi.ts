import { getAccessToken } from './googleAuth';
import { AssetItem, AssetStatus } from '../types';

export interface SheetTabInfo {
  sheetId: number;
  title: string;
  index: number;
  rowCount?: number;
  columnCount?: number;
}

export interface SpreadsheetInfo {
  spreadsheetId: string;
  title: string;
  sheets: SheetTabInfo[];
  spreadsheetUrl?: string;
}

async function getAuthHeader(): Promise<HeadersInit> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('กรุณาลงชื่อเข้าใช้ด้วย Google ก่อนใช้งาน Google Sheets');
  }
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Fetch spreadsheet metadata to discover sheet tabs (Avoid hardcoding 'Sheet1')
 */
export async function getSpreadsheetMetadata(spreadsheetId: string): Promise<SpreadsheetInfo> {
  const headers = await getAuthHeader();
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=spreadsheetId,properties.title,sheets(properties(sheetId,title,index,gridProperties(rowCount,columnCount))),spreadsheetUrl`;

  const res = await fetch(url, { headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Google Sheets API Error (${res.status})`);
  }

  const data = await res.json();
  const sheets: SheetTabInfo[] = (data.sheets || []).map((s: any) => ({
    sheetId: s.properties?.sheetId,
    title: s.properties?.title || 'Sheet1',
    index: s.properties?.index || 0,
    rowCount: s.properties?.gridProperties?.rowCount,
    columnCount: s.properties?.gridProperties?.columnCount,
  }));

  return {
    spreadsheetId: data.spreadsheetId,
    title: data.properties?.title || 'Untitled Spreadsheet',
    sheets,
    spreadsheetUrl: data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
  };
}

/**
 * Read values from a specific sheet range
 */
export async function fetchSheetValues(
  spreadsheetId: string,
  sheetTitle: string,
  range = 'A1:ZZ5000'
): Promise<string[][]> {
  const headers = await getAuthHeader();
  const fullRange = `${encodeURIComponent(sheetTitle)}!${range}`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${fullRange}?valueRenderOption=FORMATTED_VALUE`;

  const res = await fetch(url, { headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Error reading Google Sheet: ${res.status}`);
  }

  const data = await res.json();
  return (data.values as string[][]) || [];
}

/**
 * Parses rows from Google Sheets into AssetItem array with flexible header detection
 */
export async function fetchAssetsFromSheet(
  spreadsheetId: string,
  sheetTitle: string
): Promise<AssetItem[]> {
  const rows = await fetchSheetValues(spreadsheetId, sheetTitle);
  if (!rows || rows.length < 2) {
    return [];
  }

  // Find header row (first non-empty row)
  let headerIndex = 0;
  for (let i = 0; i < Math.min(5, rows.length); i++) {
    const row = rows[i];
    if (row && row.some((c) => String(c).trim().length > 0)) {
      headerIndex = i;
      break;
    }
  }

  const rawHeaders = rows[headerIndex].map((h) => String(h || '').trim().toLowerCase());
  
  // Helper to find column index matching multiple possible header names
  const findCol = (...keywords: string[]): number => {
    return rawHeaders.findIndex((h) =>
      keywords.some((k) => h === k.toLowerCase() || h.includes(k.toLowerCase()))
    );
  };

  const colSap = findCol('หมายเลขครุภัณฑ์', 'รหัสsap', 'sap no', 'sapno', 'sap', 'id', 'รหัสพัสดุ');
  const colName = findCol('รายละเอียด', 'ชื่อพัสดุ', 'รายการ', 'name', 'description', 'พัสดุ');
  const colLocation = findCol('สถานที่ตั้ง', 'สถานที่', 'location', 'อาคาร');
  const colRoom = findCol('ห้อง', 'room', 'room no');
  const colSerial = findCol('serial no', 'serialno', 'serial', 's/n', 'หมายเลขเครื่อง');
  const colTeam = findCol('แบ่งทีม', 'ทีมตรวจ', 'ทีม', 'team');
  const colStatus = findCol('สถานะผลตรวจ', 'สถานะการตรวจ', 'สถานะ', 'status');
  const colInvDept = findCol('หน่วยงานผู้ถือครองไม่ถูกต้อง', 'หน่วยงานไม่ถูกต้อง');
  const colInvLoc = findCol('สถานที่ตั้งไม่ถูกต้อง', 'สถานที่ผิด');
  const colInvModel = findCol('ไม่มียี่ห้อ/รุ่นหรือมีแต่ไม่ถูกต้อง', 'รุ่นไม่ถูกต้อง', 'ยี่ห้อไม่ถูกต้อง');
  const colSticker = findCol('ขอรับป้ายสติ๊กเกอร์', 'ขอสติ๊กเกอร์', 'sticker');
  const colNote = findCol('ระบุสาเหตุ', 'สาเหตุ', 'note', 'รายละเอียดที่ต้องแก้ไข');
  const colRemark = findCol('หมายเหตุ', 'remark');
  const colReturned = findCol('ส่งคืน', 'คืนพัสดุ', 'returnedto');
  const colUpdatedBy = findCol('ผู้ตรวจ', 'updatedby', 'inspector');
  const colUpdatedAt = findCol('เวลาที่ตรวจ', 'วันเวลา', 'updatedat', 'timestamp');
  const colBudget = findCol('ปีงบ', 'budgetyear', 'ปีงบประมาณ');
  const colValue = findCol('มูลค่า', 'value', 'ราคา');
  const colVendor = findCol('ชื่อผู้ขาย', 'ผู้ขาย', 'vendor');
  const colCostCenterName = findCol('หน่วยงาน', 'costcentername', 'ชื่อหน่วยงาน');
  const colCostCenterNo = findCol('costcenterno', 'รหัสหน่วยงาน');

  const assets: AssetItem[] = [];

  for (let r = headerIndex + 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;

    const getVal = (idx: number): string => (idx >= 0 && idx < row.length ? String(row[idx] || '').trim() : '');

    const sapNo = getVal(colSap) || `ITEM-${r}`;
    if (!sapNo && !getVal(colName)) continue; // skip totally empty rows

    // Parse status
    const rawStat = getVal(colStatus).toLowerCase();
    let status: AssetStatus = 'pending';
    if (rawStat.includes('ใช้ได้') || rawStat.includes('พบ') || rawStat === 'found') {
      status = 'found';
    } else if (rawStat.includes('ชำรุด') || rawStat === 'broken') {
      status = 'broken';
    } else if (rawStat.includes('เสื่อม') || rawStat === 'deteriorated') {
      status = 'deteriorated';
    } else if (rawStat.includes('ไม่พบ') || rawStat === 'missing') {
      status = 'missing';
    }

    const checkBoolean = (val: string): boolean => {
      const lower = val.toLowerCase();
      return lower === 'ใช่' || lower === 'true' || lower === '1' || lower === 'yes' || lower === 'y';
    };

    assets.push({
      id: sapNo,
      sapNo,
      name: getVal(colName) || 'ไม่ระบุชื่อพัสดุ',
      location: getVal(colLocation) || '-',
      room: getVal(colRoom) || '-',
      serialNo: getVal(colSerial) || '-',
      team: getVal(colTeam),
      status,
      invalidDepartment: checkBoolean(getVal(colInvDept)),
      invalidLocation: checkBoolean(getVal(colInvLoc)),
      invalidModel: checkBoolean(getVal(colInvModel)),
      requestSticker: checkBoolean(getVal(colSticker)),
      note: getVal(colNote),
      remark: getVal(colRemark),
      returnedTo: getVal(colReturned),
      updatedBy: getVal(colUpdatedBy) || 'Google Sheets',
      updatedAt: getVal(colUpdatedAt) || new Date().toISOString(),
      budgetYear: getVal(colBudget),
      value: getVal(colValue),
      vendor: getVal(colVendor),
      costCenterName: getVal(colCostCenterName),
      costCenterNo: getVal(colCostCenterNo),
      seq: String(assets.length + 1),
    });
  }

  return assets;
}

export function formatStatusLabel(status: AssetStatus): string {
  switch (status) {
    case 'found':
      return 'ใช้งานได้ (พบ)';
    case 'broken':
      return 'ชำรุด';
    case 'deteriorated':
      return 'เสื่อมสภาพ';
    case 'missing':
      return 'ตรวจไม่พบ';
    default:
      return 'ยังไม่ตรวจ';
  }
}

/**
 * Creates a brand new Google Spreadsheet in Google Drive formatted for asset inventory
 */
export async function createInventorySpreadsheet(
  title: string,
  assets: AssetItem[]
): Promise<SpreadsheetInfo> {
  const headers = await getAuthHeader();

  const headerRow = [
    'ลำดับที่',
    'หมายเลขครุภัณฑ์ (SAP)',
    'ชื่อพัสดุ / รายละเอียด',
    'Serial no.',
    'สถานที่ตั้ง',
    'ห้อง',
    'ทีมตรวจ',
    'สถานะผลตรวจ',
    'หน่วยงานผู้ถือครองไม่ถูกต้อง',
    'สถานที่ตั้งไม่ถูกต้อง',
    'ไม่มียี่ห้อ/รุ่น หรือมีแต่ไม่ถูกต้อง',
    'ขอรับป้ายสติ๊กเกอร์',
    'สาเหตุ/รายละเอียดที่ต้องแก้ไข',
    'หมายเหตุ',
    'สถานะส่งคืน',
    'ปีงบ',
    'มูลค่า',
    'ชื่อผู้ขาย',
    'ผู้ตรวจล่าสุด',
    'วันเวลาที่ตรวจ',
  ];

  const dataRows = assets.map((a, idx) => [
    idx + 1,
    a.sapNo,
    a.name,
    a.serialNo || '-',
    a.location || '-',
    a.room || '-',
    a.team || '',
    formatStatusLabel(a.status),
    a.invalidDepartment ? 'ใช่' : '',
    a.invalidLocation ? 'ใช่' : '',
    a.invalidModel ? 'ใช่' : '',
    a.requestSticker ? 'ใช่' : '',
    a.note || '',
    a.remark || '',
    a.returnedTo || '',
    a.budgetYear || '',
    a.value || '',
    a.vendor || '',
    a.updatedBy || '',
    a.updatedAt ? new Date(a.updatedAt).toLocaleString('th-TH') : '',
  ]);

  const requestBody = {
    properties: {
      title,
    },
    sheets: [
      {
        properties: {
          title: 'รายการพัสดุครุภัณฑ์',
          gridProperties: {
            frozenRowCount: 1,
            rowCount: Math.max(100, dataRows.length + 10),
            columnCount: headerRow.length + 2,
          },
        },
        data: [
          {
            startRow: 0,
            startColumn: 0,
            rowData: [
              {
                values: headerRow.map((h) => ({
                  userEnteredValue: { stringValue: h },
                  userEnteredFormat: {
                    backgroundColor: { red: 0.08, green: 0.18, blue: 0.36 }, // Deep Navy
                    textFormat: {
                      bold: true,
                      foregroundColor: { red: 1, green: 1, blue: 1 },
                      fontSize: 10,
                    },
                    horizontalAlignment: 'CENTER',
                  },
                })),
              },
              ...dataRows.map((row) => ({
                values: row.map((cell) => ({
                  userEnteredValue:
                    typeof cell === 'number'
                      ? { numberValue: cell }
                      : { stringValue: String(cell ?? '') },
                })),
              })),
            ],
          },
        ],
      },
    ],
  };

  const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers,
    body: JSON.stringify(requestBody),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to create Google Spreadsheet: ${res.status}`);
  }

  const created = await res.json();
  return {
    spreadsheetId: created.spreadsheetId,
    title: created.properties?.title || title,
    sheets: [
      {
        sheetId: created.sheets?.[0]?.properties?.sheetId || 0,
        title: created.sheets?.[0]?.properties?.title || 'รายการพัสดุครุภัณฑ์',
        index: 0,
      },
    ],
    spreadsheetUrl: created.spreadsheetUrl,
  };
}

/**
 * Write/Update assets to an existing Google Spreadsheet
 * NOTE: Workspace Integration Skill requires an explicit user confirmation dialog
 * before calling this function!
 */
export async function syncAssetsToExistingSheet(
  spreadsheetId: string,
  sheetTitle: string,
  assets: AssetItem[]
): Promise<{ updatedRows: number }> {
  const headers = await getAuthHeader();

  const headerRow = [
    'ลำดับที่',
    'หมายเลขครุภัณฑ์ (SAP)',
    'ชื่อพัสดุ / รายละเอียด',
    'Serial no.',
    'สถานที่ตั้ง',
    'ห้อง',
    'ทีมตรวจ',
    'สถานะผลตรวจ',
    'หน่วยงานผู้ถือครองไม่ถูกต้อง',
    'สถานที่ตั้งไม่ถูกต้อง',
    'ไม่มียี่ห้อ/รุ่น หรือมีแต่ไม่ถูกต้อง',
    'ขอรับป้ายสติ๊กเกอร์',
    'สาเหตุ/รายละเอียดที่ต้องแก้ไข',
    'หมายเหตุ',
    'สถานะส่งคืน',
    'ปีงบ',
    'มูลค่า',
    'ชื่อผู้ขาย',
    'ผู้ตรวจล่าสุด',
    'วันเวลาที่ตรวจ',
  ];

  const dataRows = assets.map((a, idx) => [
    idx + 1,
    a.sapNo,
    a.name,
    a.serialNo || '-',
    a.location || '-',
    a.room || '-',
    a.team || '',
    formatStatusLabel(a.status),
    a.invalidDepartment ? 'ใช่' : '',
    a.invalidLocation ? 'ใช่' : '',
    a.invalidModel ? 'ใช่' : '',
    a.requestSticker ? 'ใช่' : '',
    a.note || '',
    a.remark || '',
    a.returnedTo || '',
    a.budgetYear || '',
    a.value || '',
    a.vendor || '',
    a.updatedBy || '',
    a.updatedAt ? new Date(a.updatedAt).toLocaleString('th-TH') : '',
  ]);

  const allValues = [headerRow, ...dataRows];
  const range = `${encodeURIComponent(sheetTitle)}!A1:T${allValues.length}`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`;

  const res = await fetch(url, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      range: `${sheetTitle}!A1:T${allValues.length}`,
      majorDimension: 'ROWS',
      values: allValues,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to update Google Sheet: ${res.status}`);
  }

  const result = await res.json();
  return { updatedRows: result.updatedRows || allValues.length };
}
