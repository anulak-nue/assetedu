import { AssetItem, AssetStatus } from '../types';

export async function fetchFromGoogleSheets(gasUrl: string): Promise<AssetItem[]> {
  if (!gasUrl || !gasUrl.startsWith('http')) {
    throw new Error('กรุณาระบุ URL ของ Google Apps Script ให้ถูกต้อง');
  }

  // Ensure ?api=json parameter is appended so Google Apps Script doGet returns JSON
  const urlWithParam = gasUrl.includes('api=json')
    ? gasUrl
    : `${gasUrl}${gasUrl.includes('?') ? '&' : '?'}api=json`;

  const response = await fetch(urlWithParam, {
    method: 'GET',
    redirect: 'follow',
  });

  if (!response.ok) {
    throw new Error(`Google Sheets HTTP Error: ${response.status} ${response.statusText}`);
  }

  const text = await response.text();
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error('ข้อมูลที่ตอบกลับมาจาก Google Sheets ไม่ใช่รูปแบบ JSON (อาจเป็นหน้าเว็บ HTML หรือยังไม่ได้ตั้งค่าสิทธิ์ Anyone)');
  }

  if (Array.isArray(json)) {
    const isMarked = (val: unknown): boolean => {
      if (!val) return false;
      const s = String(val).toLowerCase().trim();
      return s === '✓' || s === '✔' || s === '√' || s === 'v' || s === 'x' || s === 'ใช่' || s === 'true' || s === '1' || s === 'yes' || s === 'y' || s === 'พบ';
    };

    return json.map((item, idx) => {
      const sapNo = String(item.sapNo || item['หมายเลขครุภัณฑ์'] || item['รหัสSAP'] || item.id || `ITEM-${idx + 1}`).trim();
      let status: AssetStatus = 'pending';
      const rawStatus = (item.status || item['สถานะผลตรวจ'] || item['สถานะ'] || '').toLowerCase();
      if (rawStatus === 'found' || rawStatus.includes('ใช้ได้') || rawStatus.includes('ปกติ') || rawStatus.includes('พบ')) {
        status = 'found';
      } else if (rawStatus === 'broken' || rawStatus.includes('ชำรุด')) {
        status = 'broken';
      } else if (rawStatus === 'deteriorated' || rawStatus.includes('เสื่อม')) {
        status = 'deteriorated';
      } else if (rawStatus === 'missing' || rawStatus.includes('ไม่พบ')) {
        status = 'missing';
      }

      // Checkbox columns check (✓)
      if (isMarked(item['ใช้งานได้']) || isMarked(item['ใช้งานได้ (พบ)']) || isMarked(item['สภาพใช้งานได้']) || isMarked(item['ใช้ได้'])) {
        status = 'found';
      } else if (isMarked(item['ชำรุด'])) {
        status = 'broken';
      } else if (isMarked(item['เสื่อมสภาพ'])) {
        status = 'deteriorated';
      } else if (isMarked(item['ตรวจไม่พบ']) || isMarked(item['สูญหาย']) || isMarked(item['ไม่พบ'])) {
        status = 'missing';
      }

      return {
        id: sapNo,
        sapNo,
        costCenterName: item.costCenterName || item['Costcentername'] || item['หน่วยงาน'] || '',
        costCenterNo: item.costCenterNo || item['Costcenterno.'] || '',
        seq: String(item.seq || item['ลำดับที่'] || idx + 1),
        name: item.name || item['รายละเอียด'] || item['ชื่อพัสดุ'] || '-',
        serialNo: item.serialNo || item['Serialno.'] || item['SerialNo'] || '-',
        location: item.location || item['สถานที่ตั้ง'] || '-',
        room: item.room || item['ห้อง'] || '-',
        budgetYear: String(item.budgetYear || item['ปีงบ'] || ''),
        value: String(item.value || item['มูลค่า'] || ''),
        vendor: item.vendor || item['ชื่อผู้ขาย'] || '',
        status,
        invalidDepartment: Boolean(item.invalidDepartment || item['หน่วยงานผู้ถือครองไม่ถูกต้อง']),
        invalidLocation: Boolean(item.invalidLocation || item['สถานที่ตั้งไม่ถูกต้อง']),
        invalidModel: Boolean(item.invalidModel || item['ไม่มียี่ห้อ/รุ่นหรือมีแต่ไม่ถูกต้อง']),
        note: item.note || item['ระบุสาเหตุของสถานะครุภัณฑ์หรือรายละเอียดที่ต้องแก้ไขหากพบว่าข้อมูลครุภัณฑ์ไม่ถูกต้อง'] || item['สาเหตุ'] || '',
        requestSticker: Boolean(item.requestSticker || item['ขอรับป้ายสติ๊กเกอร์']),
        remark: item.remark || item['หมายเหตุ'] || '',
        team: item.team || item['แบ่งทีม'] || item['ทีมตรวจ'] || item['ทีม'] || '',
        returnedTo: item.returnedTo || item['ส่งคืน'] || item['คืนพัสดุ'] || '',
        updatedBy: item.updatedBy || item['ผู้ตรวจ'] || 'Google Sheets',
        updatedAt: item.updatedAt || item['เวลาที่ตรวจ'] || new Date().toISOString(),
      };
    });
  }

  if (json && typeof json === 'object' && 'error' in json) {
    throw new Error(String((json as { error: unknown }).error));
  }

  throw new Error('รูปแบบข้อมูลจาก Google Sheets ไม่ถูกต้อง');
}

export async function pushToGoogleSheets(
  gasUrl: string,
  data: Partial<AssetItem> | Partial<AssetItem>[]
): Promise<boolean> {
  if (!gasUrl || !gasUrl.startsWith('http')) return false;

  try {
    const response = await fetch(gasUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(data),
      keepalive: true,
    });
    return response.ok;
  } catch (err) {
    console.warn('Push to Google Sheets error:', err);
    return false;
  }
}
