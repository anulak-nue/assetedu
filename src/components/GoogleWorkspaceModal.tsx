import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  FileSpreadsheet,
  HardDrive,
  ExternalLink,
  RefreshCw,
  PlusCircle,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  Search,
  LogIn,
  LogOut,
  FolderOpen,
  Calendar,
  Sparkles,
  FileText,
  Clock,
  User as UserIcon,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { AssetItem } from '../types';
import {
  googleSignIn,
  googleSignOut,
  getAccessToken,
  getCurrentUser,
} from '../services/googleAuth';
import {
  listGoogleSpreadsheets,
  listDriveFiles,
  uploadTextFileToDrive,
  DriveFileItem,
} from '../services/googleDrive';
import {
  getSpreadsheetMetadata,
  fetchAssetsFromSheet,
  createInventorySpreadsheet,
  syncAssetsToExistingSheet,
  SpreadsheetInfo,
} from '../services/googleSheetsApi';
import { WorkspaceConfirmModal } from './WorkspaceConfirmModal';

interface GoogleWorkspaceModalProps {
  isOpen: boolean;
  currentUser: User | null;
  assets: AssetItem[];
  onClose: () => void;
  onImportAssets: (newAssets: AssetItem[], sourceName: string) => void;
  onToast: (message: string, type?: 'success' | 'error') => void;
}

export const GoogleWorkspaceModal: React.FC<GoogleWorkspaceModalProps> = ({
  isOpen,
  currentUser,
  assets,
  onClose,
  onImportAssets,
  onToast,
}) => {
  const [activeTab, setActiveTab] = useState<'sheets' | 'drive'>('sheets');
  const [user, setUser] = useState<User | null>(currentUser);
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Drive Spreadsheets state
  const [spreadsheets, setSpreadsheets] = useState<DriveFileItem[]>([]);
  const [isLoadingSpreadsheets, setIsLoadingSpreadsheets] = useState(false);
  const [sheetSearchQuery, setSheetSearchQuery] = useState('');

  // Selected Spreadsheet state
  const [selectedSpreadsheetId, setSelectedSpreadsheetId] = useState<string>('');
  const [manualSheetInput, setManualSheetInput] = useState<string>('');
  const [spreadsheetMetadata, setSpreadsheetMetadata] = useState<SpreadsheetInfo | null>(null);
  const [selectedSheetTab, setSelectedSheetTab] = useState<string>('');
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);

  // Drive Files state (Tab 2)
  const [driveFiles, setDriveFiles] = useState<DriveFileItem[]>([]);
  const [isLoadingDriveFiles, setIsLoadingDriveFiles] = useState(false);
  const [driveSearchQuery, setDriveSearchQuery] = useState('');

  // Operations state
  const [isProcessing, setIsProcessing] = useState(false);

  // Confirmation Modal state (Mandatory for Destructive / Mutating operations)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    details?: {
      actionType: string;
      targetName: string;
      itemCount?: number;
      destination?: string;
    };
    confirmLabel?: string;
    confirmVariant?: 'danger' | 'warning' | 'primary';
    action: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    description: '',
    action: async () => {},
  });

  // Sync user state with props
  useEffect(() => {
    setUser(currentUser);
  }, [currentUser]);

  // Handle Login
  const handleLogin = async () => {
    setIsSigningIn(true);
    try {
      const res = await googleSignIn();
      if (res?.user) {
        setUser(res.user);
        onToast(`ลงชื่อเข้าใช้ในชื่อ ${res.user.displayName || res.user.email} สำเร็จ`, 'success');
        loadUserSpreadsheets();
      }
    } catch (err: any) {
      console.warn('Login notice:', err?.message || err);
      onToast(`เข้าสู่ระบบไม่สำเร็จ: ${err.message || 'โปรดลองใหม่อีกครั้ง'}`, 'error');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await googleSignOut();
      setUser(null);
      setSpreadsheets([]);
      setSpreadsheetMetadata(null);
      setDriveFiles([]);
      onToast('ออกจากระบบ Google เรียบร้อยแล้ว', 'success');
    } catch (err: any) {
      onToast('เกิดข้อผิดพลาดในการออกจากระบบ', 'error');
    }
  };

  // Load Spreadsheets from Google Drive
  const loadUserSpreadsheets = useCallback(async (query?: string) => {
    const token = await getAccessToken();
    if (!token) return;

    setIsLoadingSpreadsheets(true);
    try {
      const files = await listGoogleSpreadsheets(query);
      setSpreadsheets(files);
      if (files.length > 0 && !selectedSpreadsheetId) {
        setSelectedSpreadsheetId(files[0].id);
      }
    } catch (err: any) {
      console.warn('Error loading spreadsheets from Drive:', err);
    } finally {
      setIsLoadingSpreadsheets(false);
    }
  }, [selectedSpreadsheetId]);

  // Load General Drive Files (Tab 2)
  const loadDriveFiles = useCallback(async (query?: string) => {
    const token = await getAccessToken();
    if (!token) return;

    setIsLoadingDriveFiles(true);
    try {
      const files = await listDriveFiles({ searchTerm: query, pageSize: 30 });
      setDriveFiles(files);
    } catch (err: any) {
      console.warn('Error loading Drive files:', err);
    } finally {
      setIsLoadingDriveFiles(false);
    }
  }, []);

  // When modal opens or tab changes, load data if token exists
  useEffect(() => {
    if (isOpen) {
      getAccessToken().then((token) => {
        if (token) {
          if (activeTab === 'sheets') {
            loadUserSpreadsheets();
          } else {
            loadDriveFiles();
          }
        }
      });
    }
  }, [isOpen, activeTab, loadUserSpreadsheets, loadDriveFiles]);

  // Fetch metadata when selectedSpreadsheetId changes
  useEffect(() => {
    if (!selectedSpreadsheetId) {
      setSpreadsheetMetadata(null);
      return;
    }

    let isMounted = true;
    setIsLoadingMetadata(true);

    getSpreadsheetMetadata(selectedSpreadsheetId)
      .then((meta) => {
        if (isMounted) {
          setSpreadsheetMetadata(meta);
          if (meta.sheets && meta.sheets.length > 0) {
            setSelectedSheetTab(meta.sheets[0].title);
          }
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.warn('Failed to load sheet metadata:', err);
          setSpreadsheetMetadata(null);
        }
      })
      .finally(() => {
        if (isMounted) setIsLoadingMetadata(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedSpreadsheetId]);

  // Handle manual input of spreadsheet ID or URL
  const handleManualSheetApply = () => {
    let clean = manualSheetInput.trim();
    if (!clean) return;

    // Match Google Sheet ID from URL format: /spreadsheets/d/([a-zA-Z0-9-_]+)
    const match = clean.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      clean = match[1];
    }

    setSelectedSpreadsheetId(clean);
  };

  // Action: Import from Sheet
  const handleImportFromSheet = async () => {
    if (!selectedSpreadsheetId || !selectedSheetTab) {
      onToast('กรุณาเลือกไฟล์และแท็บชีตที่ต้องการนำเข้า', 'error');
      return;
    }

    setIsProcessing(true);
    try {
      const imported = await fetchAssetsFromSheet(selectedSpreadsheetId, selectedSheetTab);
      if (imported.length === 0) {
        onToast('ไม่พบข้อมูลพัสดุในแท็บที่เลือก กรุณาตรวจสอบหัวตาราง', 'error');
        return;
      }

      onImportAssets(imported, spreadsheetMetadata?.title || 'Google Sheets');
      onToast(`นำเข้าพัสดุจาก Google Sheet สำเร็จ (${imported.length} รายการ)`, 'success');
      onClose();
    } catch (err: any) {
      console.error('Import error:', err);
      onToast(`นำเข้าข้อมูลไม่สำเร็จ: ${err.message || 'ข้อผิดพลาดไม่ทราบสาเหตุ'}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Action: Prompt confirmation to overwrite/update Google Sheet
  const handlePromptSyncToSheet = () => {
    if (!selectedSpreadsheetId || !selectedSheetTab) {
      onToast('กรุณาเลือกไฟล์และแท็บชีตที่ต้องการอัปเดตข้อมูล', 'error');
      return;
    }

    const sheetName = spreadsheetMetadata?.title || 'Google Sheet';
    setConfirmDialog({
      isOpen: true,
      title: 'ยืนยันการเขียนข้อมูลลง Google Sheets',
      description: `ท่านต้องการอัปเดตผลการตรวจนับครุภัณฑ์จำนวน ${assets.length.toLocaleString()} รายการ ลงในไฟล์ "${sheetName}" แท็บ "${selectedSheetTab}" ใช่หรือไม่? ข้อมูลแถวเดิมจะถูกอัปเดตด้วยผลการตรวจล่าสุด`,
      details: {
        actionType: 'อัปเดตข้อมูลแถวในชีต (Sheets API v4)',
        targetName: `${sheetName} (${selectedSheetTab})`,
        itemCount: assets.length,
        destination: `https://docs.google.com/spreadsheets/d/${selectedSpreadsheetId}`,
      },
      confirmLabel: 'ยืนยันการอัปเดต Google Sheet',
      confirmVariant: 'warning',
      action: async () => {
        setIsProcessing(true);
        try {
          const res = await syncAssetsToExistingSheet(selectedSpreadsheetId, selectedSheetTab, assets);
          onToast(`อัปเดตข้อมูลลง Google Sheet สำเร็จ (${res.updatedRows} แถว)`, 'success');
        } catch (err: any) {
          console.error('Sync to sheet error:', err);
          onToast(`อัปเดตข้อมูลไม่สำเร็จ: ${err.message || 'โปรดตรวจสอบสิทธิ์เข้าถึง'}`, 'error');
        } finally {
          setIsProcessing(false);
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // Action: Create brand new Google Sheet in Drive
  const handleCreateNewSheet = () => {
    const defaultTitle = `ผลการตรวจนับพัสดุครุภัณฑ์ประจำปี_${new Date().toLocaleDateString('th-TH').replace(/\//g, '-')}`;

    setConfirmDialog({
      isOpen: true,
      title: 'สร้าง Google Spreadsheet ใหม่ใน Google Drive',
      description: `ระบบจะสร้างไฟล์สเปรดชีตใหม่ชื่อ "${defaultTitle}" ใน Google Drive ของท่าน พร้อมจัดรูปแบบหัวตารางและนำเข้าข้อมูลพัสดุ ${assets.length.toLocaleString()} รายการ`,
      details: {
        actionType: 'สร้างไฟล์สเปรดชีตใหม่ (Sheets API + Drive)',
        targetName: defaultTitle,
        itemCount: assets.length,
        destination: 'Google Drive ของท่าน (My Drive)',
      },
      confirmLabel: 'สร้างและส่งออกข้อมูล',
      confirmVariant: 'primary',
      action: async () => {
        setIsProcessing(true);
        try {
          const newSheet = await createInventorySpreadsheet(defaultTitle, assets);
          onToast(`สร้าง Google Spreadsheet สำเร็จ!`, 'success');
          // Add to list and select it
          setSelectedSpreadsheetId(newSheet.spreadsheetId);
          loadUserSpreadsheets();
          if (newSheet.spreadsheetUrl) {
            window.open(newSheet.spreadsheetUrl, '_blank');
          }
        } catch (err: any) {
          console.error('Create sheet error:', err);
          onToast(`สร้างชีตไม่สำเร็จ: ${err.message || 'โปรดตรวจสอบการเชื่อมต่อ'}`, 'error');
        } finally {
          setIsProcessing(false);
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // Action: Backup full inventory to Google Drive as JSON/CSV
  const handleBackupToDrive = (format: 'json' | 'csv') => {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    const filename = `backup_inventory_${timestamp}.${format}`;

    let content = '';
    let mimeType = '';

    if (format === 'json') {
      content = JSON.stringify(assets, null, 2);
      mimeType = 'application/json';
    } else {
      // Simple CSV generator
      const headers = ['sapNo', 'name', 'location', 'room', 'team', 'status', 'updatedBy', 'updatedAt'];
      const rows = assets.map((a) =>
        [a.sapNo, `"${a.name.replace(/"/g, '""')}"`, a.location, a.room, a.team || '', a.status, a.updatedBy || '', a.updatedAt || ''].join(',')
      );
      content = '\ufeff' + [headers.join(','), ...rows].join('\n');
      mimeType = 'text/csv';
    }

    setConfirmDialog({
      isOpen: true,
      title: `สำรองข้อมูลลง Google Drive (${format.toUpperCase()})`,
      description: `ท่านต้องการบันทึกไฟล์สำรองข้อมูล "${filename}" จำนวน ${assets.length.toLocaleString()} รายการ ลงใน Google Drive ของท่านใช่หรือไม่?`,
      details: {
        actionType: 'อัปโหลดไฟล์สำรองข้อมูล (Drive API v3)',
        targetName: filename,
        itemCount: assets.length,
        destination: 'Google Drive ของท่าน',
      },
      confirmLabel: 'อัปโหลดลง Google Drive',
      confirmVariant: 'primary',
      action: async () => {
        setIsProcessing(true);
        try {
          const uploaded = await uploadTextFileToDrive({
            filename,
            content,
            mimeType,
          });
          onToast(`สำรองข้อมูลลง Google Drive สำเร็จ: ${uploaded.name}`, 'success');
          loadDriveFiles();
        } catch (err: any) {
          console.error('Backup error:', err);
          onToast(`สำรองข้อมูลไม่สำเร็จ: ${err.message}`, 'error');
        } finally {
          setIsProcessing(false);
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-40 p-3 sm:p-4 animate-in fade-in duration-150"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden flex flex-col max-h-[92vh] border border-slate-200">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex items-center -space-x-1.5 bg-slate-800 p-1.5 rounded-xl border border-slate-700">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
              <HardDrive className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="font-bold text-base sm:text-lg font-heading leading-tight flex items-center gap-2">
                <span>Google Sheets & Google Drive</span>
                <span className="text-[10px] font-mono uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold">
                  Official API
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                ซิงค์ข้อมูล นำเข้า ส่งออก และสำรองไฟล์ครุภัณฑ์ผ่านระบบคลาวด์ Google Workspace
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Auth Banner */}
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          {user ? (
            <div className="flex items-center gap-3">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Google User'}
                  className="w-8 h-8 rounded-full border border-slate-300 shadow-xs"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                  {user.displayName?.slice(0, 1) || 'G'}
                </div>
              )}
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-900">{user.displayName || 'ผู้ใช้งาน Google'}</span>
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-100 font-semibold px-2 py-0.2 rounded-full">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    เชื่อมต่อ Google แล้ว
                  </span>
                </div>
                <span className="text-[11px] text-slate-500">{user.email}</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-slate-600">
              <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <span>กรุณาลงชื่อเข้าใช้ด้วย Google เพื่อเข้าถึงไฟล์ Google Sheets และ Google Drive ของท่าน</span>
            </div>
          )}

          <div>
            {user ? (
              <button
                type="button"
                onClick={handleLogout}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5 text-slate-500" />
                <span>ออกจากระบบ</span>
              </button>
            ) : (
              /* Official GSI Button Style per workspace integration guidelines */
              <button
                type="button"
                onClick={handleLogin}
                disabled={isSigningIn}
                className="px-4 py-2 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 border border-slate-300 hover:border-slate-400 rounded-xl font-medium text-xs shadow-xs flex items-center gap-2.5 transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                <span>{isSigningIn ? 'กำลังเชื่อมต่อ...' : 'Sign in with Google (ลงชื่อเข้าใช้)'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-white px-5">
          <button
            type="button"
            onClick={() => setActiveTab('sheets')}
            className={`py-3 px-4 font-heading font-semibold text-xs border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'sheets'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Google Sheets (นำเข้า & ซิงค์ข้อมูล)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('drive')}
            className={`py-3 px-4 font-heading font-semibold text-xs border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'drive'
                ? 'border-blue-600 text-blue-700 bg-blue-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <HardDrive className="w-4 h-4 text-blue-600" />
            <span>Google Drive (สำรวจไฟล์ & สำรองข้อมูล)</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 overflow-y-auto flex-1 text-xs space-y-5">
          {/* TAB 1: GOOGLE SHEETS */}
          {activeTab === 'sheets' && (
            <div className="space-y-5">
              {!user ? (
                <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-300 p-6">
                  <FileSpreadsheet className="w-12 h-12 text-emerald-500 mx-auto mb-3 opacity-80" />
                  <h3 className="font-bold text-sm text-slate-800 font-heading">
                    เข้าสู่ระบบ Google เพื่อจัดการ Google Sheets
                  </h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
                    เชื่อมต่อ Google เพื่อเลือกสเปรดชีตจากไดรฟ์ นำเข้ารายการพัสดุ และอัปเดตผลตรวจกลับไปยัง Google Sheets แบบเรียลไทม์
                  </p>
                  <button
                    type="button"
                    onClick={handleLogin}
                    disabled={isSigningIn}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all active:scale-95 inline-flex items-center gap-2 cursor-pointer"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>ลงชื่อเข้าใช้ด้วย Google เพื่อเริ่มต้น</span>
                  </button>
                </div>
              ) : (
                <>
                  {/* Select Spreadsheet Section */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-800 flex items-center gap-1.5">
                        <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                        <span>เลือก Google Spreadsheet จาก Drive ของท่าน:</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => loadUserSpreadsheets(sheetSearchQuery)}
                        disabled={isLoadingSpreadsheets}
                        className="text-slate-500 hover:text-slate-800 p-1 flex items-center gap-1 text-[11px]"
                        title="รีเฟรชรายการไฟล์"
                      >
                        <RefreshCw className={`w-3 h-3 ${isLoadingSpreadsheets ? 'animate-spin' : ''}`} />
                        <span>รีเฟรช</span>
                      </button>
                    </div>

                    {/* Search or Select from dropdown */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="sm:col-span-2">
                        <select
                          id="select-drive-sheet"
                          aria-label="เลือกไฟล์สเปรดชีตจาก Google Drive"
                          value={selectedSpreadsheetId}
                          onChange={(e) => setSelectedSpreadsheetId(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
                        >
                          <option value="">-- เลือกไฟล์สเปรดชีตจากไดรฟ์ --</option>
                          {spreadsheets.map((s) => (
                            <option key={s.id} value={s.id}>
                              📄 {s.name} {s.modifiedTime ? `(${new Date(s.modifiedTime).toLocaleDateString('th-TH')})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Filter search in Drive */}
                      <div className="relative">
                        <input
                          type="text"
                          aria-label="ค้นหาชื่อไฟล์สเปรดชีตใน Google Drive"
                          value={sheetSearchQuery}
                          onChange={(e) => setSheetSearchQuery(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && loadUserSpreadsheets(sheetSearchQuery)}
                          placeholder="ค้นหาชื่อไฟล์ในไดรฟ์..."
                          className="w-full bg-white border border-slate-300 rounded-lg pl-8 pr-2 py-2 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
                        />
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                      </div>
                    </div>

                    {/* Or Manual URL/ID */}
                    <div className="pt-2 border-t border-slate-200/80 flex items-center gap-2">
                      <span className="text-[11px] text-slate-500 whitespace-nowrap">หรือระบุ Sheet URL / ID:</span>
                      <input
                        type="text"
                        aria-label="ระบุ Google Spreadsheet URL หรือ ID ด้วยตนเอง"
                        value={manualSheetInput}
                        onChange={(e) => setManualSheetInput(e.target.value)}
                        placeholder="https://docs.google.com/spreadsheets/d/.../edit หรือใส่ ID"
                        className="flex-1 bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-[11px] font-mono outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={handleManualSheetApply}
                        className="px-2.5 py-1 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-[11px] font-semibold whitespace-nowrap cursor-pointer"
                      >
                        ใช้งาน ID นี้
                      </button>
                    </div>
                  </div>

                  {/* Active Sheet Details & Tab Selection */}
                  {selectedSpreadsheetId && (
                    <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-emerald-950 font-heading">
                              {spreadsheetMetadata?.title || 'กำลังโหลดข้อมูลชีต...'}
                            </span>
                            {isLoadingMetadata && <RefreshCw className="w-3 h-3 text-emerald-600 animate-spin" />}
                          </div>
                          <span className="text-[11px] text-emerald-800 font-mono">
                            ID: {selectedSpreadsheetId}
                          </span>
                        </div>

                        {spreadsheetMetadata?.spreadsheetUrl && (
                          <a
                            href={spreadsheetMetadata.spreadsheetUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 bg-white hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-lg text-xs font-semibold flex items-center gap-1 shadow-2xs transition-colors"
                          >
                            <span>เปิดใน Google Sheets</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>

                      {/* Tab selection */}
                      {spreadsheetMetadata?.sheets && spreadsheetMetadata.sheets.length > 0 && (
                        <div className="flex items-center gap-2 pt-2 border-t border-emerald-200/60">
                          <span className="text-xs font-semibold text-emerald-900 whitespace-nowrap">
                            เลือกแท็บ (Worksheet Tab):
                          </span>
                          <select
                            id="select-sheet-tab"
                            aria-label="เลือกแท็บชีตสำหรับทำงาน"
                            value={selectedSheetTab}
                            onChange={(e) => setSelectedSheetTab(e.target.value)}
                            className="bg-white border border-emerald-300 text-emerald-900 rounded-lg px-2.5 py-1 text-xs font-medium outline-none focus:ring-1 focus:ring-emerald-500"
                          >
                            {spreadsheetMetadata.sheets.map((tab) => (
                              <option key={tab.sheetId} value={tab.title}>
                                📑 {tab.title} {tab.rowCount ? `(${tab.rowCount} แถว)` : ''}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Action buttons for Selected Sheet */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-3">
                        {/* Import Button */}
                        <button
                          type="button"
                          id="btn-import-google-sheet"
                          onClick={handleImportFromSheet}
                          disabled={isProcessing || !selectedSheetTab}
                          className="p-3 bg-white hover:bg-emerald-600 hover:text-white border border-emerald-300 hover:border-emerald-600 text-emerald-800 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-2xs transition-all active:scale-98 disabled:opacity-50 cursor-pointer"
                        >
                          <Download className="w-4 h-4 text-emerald-600 group-hover:text-white" />
                          <span>นำเข้าพัสดุจาก Google Sheet นี้</span>
                        </button>

                        {/* Sync / Update Button (Triggers Confirmation Modal) */}
                        <button
                          type="button"
                          id="btn-update-google-sheet"
                          onClick={handlePromptSyncToSheet}
                          disabled={isProcessing || !selectedSheetTab || assets.length === 0}
                          className="p-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-98 disabled:opacity-50 cursor-pointer"
                        >
                          <Upload className="w-4 h-4" />
                          <span>อัปเดตผลตรวจ ({assets.length} รายการ) ลงชีตนี้</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Create New Sheet in Drive Section */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <h4 className="font-bold text-slate-800 flex items-center gap-1.5 font-heading">
                        <PlusCircle className="w-4 h-4 text-blue-600" />
                        <span>สร้าง Google Spreadsheet ใหม่ในไดรฟ์</span>
                      </h4>
                      <p className="text-slate-500 text-[11px]">
                        สร้างไฟล์ Google Sheet ใหม่ที่จัดวางรูปแบบตารางพัสดุ พร้อมลงข้อมูลปัจจุบัน {assets.length} รายการ
                      </p>
                    </div>

                    <button
                      type="button"
                      id="btn-create-new-spreadsheet"
                      onClick={handleCreateNewSheet}
                      disabled={isProcessing}
                      className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 disabled:opacity-50 flex-shrink-0 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-blue-200" />
                      <span>สร้างสเปรดชีตใหม่</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 2: GOOGLE DRIVE */}
          {activeTab === 'drive' && (
            <div className="space-y-5">
              {!user ? (
                <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-300 p-6">
                  <HardDrive className="w-12 h-12 text-blue-500 mx-auto mb-3 opacity-80" />
                  <h3 className="font-bold text-sm text-slate-800 font-heading">
                    เข้าสู่ระบบ Google เพื่อเข้าถึง Google Drive
                  </h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
                    ค้นหาและจัดการไฟล์สำรองข้อมูลพัสดุใน Google Drive ของคุณได้อย่างปลอดภัย
                  </p>
                  <button
                    type="button"
                    onClick={handleLogin}
                    disabled={isSigningIn}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all active:scale-95 inline-flex items-center gap-2 cursor-pointer"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>ลงชื่อเข้าใช้ด้วย Google เพื่อเริ่มต้น</span>
                  </button>
                </div>
              ) : (
                <>
                  {/* Backup Actions Card */}
                  <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-4 rounded-xl shadow-sm space-y-3">
                    <div className="flex items-center gap-2">
                      <FolderOpen className="w-5 h-5 text-blue-300" />
                      <div>
                        <h4 className="font-bold text-sm font-heading">สำรองข้อมูลพัสดุขึ้น Google Drive</h4>
                        <p className="text-[11px] text-blue-200">
                          บันทึกไฟล์สำรองของรายการพัสดุ {assets.length.toLocaleString()} รายการ เข้าสู่ Google Drive เพื่อความปลอดภัย
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        type="button"
                        id="btn-backup-drive-json"
                        onClick={() => handleBackupToDrive('json')}
                        disabled={isProcessing || assets.length === 0}
                        className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-xs active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>สำรองเป็นไฟล์ JSON</span>
                      </button>

                      <button
                        type="button"
                        id="btn-backup-drive-csv"
                        onClick={() => handleBackupToDrive('csv')}
                        disabled={isProcessing || assets.length === 0}
                        className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-blue-400/40 text-blue-100 rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-xs active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5 text-blue-300" />
                        <span>สำรองเป็นไฟล์ CSV</span>
                      </button>
                    </div>
                  </div>

                  {/* Drive File Explorer */}
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <h4 className="font-bold text-slate-800 flex items-center gap-2 font-heading">
                        <HardDrive className="w-4 h-4 text-blue-600" />
                        <span>ไฟล์ใน Google Drive ของคุณ</span>
                      </h4>

                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <input
                            type="text"
                            aria-label="ค้นหาไฟล์ใน Google Drive"
                            value={driveSearchQuery}
                            onChange={(e) => setDriveSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && loadDriveFiles(driveSearchQuery)}
                            placeholder="ค้นหาชื่อไฟล์..."
                            className="bg-slate-50 border border-slate-300 rounded-lg pl-7 pr-2 py-1 text-xs outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <Search className="w-3 h-3 text-slate-400 absolute left-2 top-2" />
                        </div>

                        <button
                          type="button"
                          onClick={() => loadDriveFiles(driveSearchQuery)}
                          disabled={isLoadingDriveFiles}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
                          title="รีเฟรชไฟล์"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isLoadingDriveFiles ? 'animate-spin' : ''}`} />
                        </button>
                      </div>
                    </div>

                    {/* Files list */}
                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                      {isLoadingDriveFiles ? (
                        <div className="p-8 text-center text-slate-400">
                          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                          <span>กำลังดึงรายการไฟล์จาก Google Drive...</span>
                        </div>
                      ) : driveFiles.length === 0 ? (
                        <div className="p-8 text-center text-slate-400">
                          <FolderOpen className="w-8 h-8 mx-auto mb-2 opacity-40" />
                          <span>ไม่พบไฟล์ใน Google Drive ที่ตรงกับเงื่อนไข</span>
                        </div>
                      ) : (
                        driveFiles.map((file) => {
                          const isSheet = file.mimeType.includes('spreadsheet');
                          return (
                            <div
                              key={file.id}
                              className="p-3 hover:bg-slate-50/80 flex items-center justify-between gap-3 transition-colors"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                {isSheet ? (
                                  <FileSpreadsheet className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                                ) : (
                                  <FileText className="w-5 h-5 text-blue-500 flex-shrink-0" />
                                )}
                                <div className="min-w-0">
                                  <div className="font-semibold text-slate-900 truncate" title={file.name}>
                                    {file.name}
                                  </div>
                                  <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                                    {file.modifiedTime && (
                                      <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {new Date(file.modifiedTime).toLocaleString('th-TH')}
                                      </span>
                                    )}
                                    {file.owners && file.owners[0] && (
                                      <span className="flex items-center gap-1 hidden sm:inline-flex">
                                        <UserIcon className="w-3 h-3" />
                                        {file.owners[0].displayName}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                {isSheet && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedSpreadsheetId(file.id);
                                      setActiveTab('sheets');
                                    }}
                                    className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold cursor-pointer"
                                  >
                                    เลือกชีตนี้
                                  </button>
                                )}

                                {file.webViewLink && (
                                  <a
                                    href={file.webViewLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
                                    title="เปิดใน Google Drive"
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                  </a>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Google Workspace OAuth 2.0 (Drive & Sheets)</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold rounded-xl"
          >
            ปิด
          </button>
        </div>
      </div>

      {/* Explicit User Confirmation Dialog (MANDATORY per Workspace Integration skill) */}
      <WorkspaceConfirmModal
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        description={confirmDialog.description}
        details={confirmDialog.details}
        confirmLabel={confirmDialog.confirmLabel}
        confirmVariant={confirmDialog.confirmVariant}
        isLoading={isProcessing}
        onConfirm={confirmDialog.action}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
