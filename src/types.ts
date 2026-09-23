export type AssetStatus = 'pending' | 'found' | 'broken' | 'deteriorated' | 'missing';

export interface AssetItem {
  id: string;
  costCenterName?: string;
  costCenterNo?: string;
  seq?: string;
  sapNo: string; // หมายเลขครุภัณฑ์ (SAP)
  name: string; // รายละเอียด/ชื่อพัสดุ
  serialNo?: string;
  location: string; // สถานที่ตั้ง
  room: string; // ห้อง
  budgetYear?: string;
  value?: string;
  vendor?: string;
  status: AssetStatus;
  invalidDepartment: boolean; // หน่วยงานผู้ถือครองไม่ถูกต้อง
  invalidLocation: boolean; // สถานที่ตั้งไม่ถูกต้อง
  invalidModel: boolean; // ไม่มียี่ห้อ/รุ่น หรือมีแต่ไม่ถูกต้อง
  note?: string; // สาเหตุ/รายละเอียดแก้ไข
  requestSticker: boolean; // ขอรับป้ายสติ๊กเกอร์
  remark?: string; // หมายเหตุ
  team?: string; // ทีมตรวจ
  returnedTo?: string; // ส่งคืน (พัสดุ / สารสนเทศ)
  updatedBy?: string; // ผู้ตรวจล่าสุด
  updatedAt?: string; // วันเวลาตรวจล่าสุด
}

export interface DashboardStats {
  total: number;
  pending: number;
  found: number;
  broken: number;
  deteriorated: number;
  missing: number;
  invalidRegistry: number;
  requestSticker: number;
}

export interface AppConfig {
  gasWebAppUrl: string;
  firebaseConfig: {
    apiKey: string;
    authDomain?: string;
    databaseURL?: string;
    projectId: string;
    storageBucket?: string;
    messagingSenderId?: string;
    appId: string;
    measurementId?: string;
  };
  inspectorName: string;
}
