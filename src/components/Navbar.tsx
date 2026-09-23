import React from 'react';
import {
  Boxes,
  Wifi,
  WifiOff,
  CloudUpload,
  RefreshCw,
  Sparkles,
  Settings,
  UserCheck,
  FileSpreadsheet,
  HardDrive,
  LogIn,
  CheckCircle2,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { AppConfig } from '../types';

interface NavbarProps {
  config: AppConfig;
  isOnline: boolean;
  isFirebaseConnected: boolean;
  isSyncingSheets: boolean;
  offlineQueueCount: number;
  googleUser: User | null;
  onOpenGoogleWorkspace: () => void;
  onGoogleSignIn: () => void;
  onLoadTestData: () => void;
  onSyncSheets: () => void;
  onOpenSettings: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  config,
  isOnline,
  isFirebaseConnected,
  isSyncingSheets,
  offlineQueueCount,
  googleUser,
  onOpenGoogleWorkspace,
  onGoogleSignIn,
  onLoadTestData,
  onSyncSheets,
  onOpenSettings,
}) => {
  return (
    <header className="bg-slate-900 text-white shadow-md sticky top-0 z-30 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Logo and title */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm flex-shrink-0">
              <Boxes className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-base sm:text-lg leading-tight truncate font-heading tracking-wide">
                ตรวจสอบพัสดุประจำปี
              </h1>
              <p className="text-[11px] text-slate-400 hidden sm:block truncate">
                ระบบตรวจนับครุภัณฑ์ออนไลน์เรียลไทม์ &bull; Google Sheets & Drive Cloud Sync
              </p>
            </div>
          </div>

          {/* Action buttons and indicators */}
          <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">
            {/* Offline queue badge if items waiting */}
            {offlineQueueCount > 0 && (
              <span
                className="text-[11px] bg-amber-500 text-slate-950 font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow animate-pulse"
                title="มีรายการที่รอซิงค์ขึ้นระบบ"
              >
                <CloudUpload className="w-3.5 h-3.5" />
                <span>รอซิงค์ {offlineQueueCount}</span>
              </span>
            )}

            {/* Google Drive & Sheets Integration Button */}
            <button
              id="btn-open-workspace"
              onClick={onOpenGoogleWorkspace}
              className="px-2.5 sm:px-3 py-1.5 bg-gradient-to-r from-emerald-700/80 to-teal-800/80 hover:from-emerald-600 hover:to-teal-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-emerald-500/40 shadow-xs active:scale-95 transition-all cursor-pointer"
              title="เปิดจัดการ Google Sheets และ Google Drive"
            >
              <div className="flex items-center -space-x-1">
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-300" />
                <HardDrive className="w-3.5 h-3.5 text-blue-300" />
              </div>
              <span className="font-medium">Sheets & Drive</span>
            </button>

            {/* Google Account Profile / Sign-in */}
            {googleUser ? (
              <button
                type="button"
                id="btn-google-user-chip"
                onClick={onOpenGoogleWorkspace}
                className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs text-slate-200 transition-colors cursor-pointer"
                title={`เชื่อมต่อ Google: ${googleUser.email}`}
              >
                {googleUser.photoURL ? (
                  <img
                    src={googleUser.photoURL}
                    alt=""
                    className="w-4 h-4 rounded-full border border-slate-600"
                  />
                ) : (
                  <div className="w-4 h-4 rounded-full bg-blue-600 text-[10px] text-white flex items-center justify-center font-bold">
                    {googleUser.displayName?.slice(0, 1) || 'G'}
                  </div>
                )}
                <span className="max-w-[100px] truncate">{googleUser.displayName?.split(' ')[0] || 'Google User'}</span>
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              </button>
            ) : (
              /* Official GSI Style button */
              <button
                type="button"
                id="btn-nav-google-signin"
                onClick={onGoogleSignIn}
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-800 rounded-lg text-xs font-semibold shadow-xs border border-slate-300 active:scale-95 transition-all cursor-pointer"
                title="ลงชื่อเข้าใช้ด้วยบัญชี Google เพื่อใช้งาน Drive และ Sheets"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                <span>Google</span>
              </button>
            )}

            {/* Connection status indicator */}
            <div
              className={`hidden xl:flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${
                isFirebaseConnected && isOnline
                  ? 'bg-emerald-950/60 text-emerald-400 border-emerald-700/60'
                  : 'bg-slate-800 text-amber-300 border-amber-800/60'
              }`}
            >
              {isFirebaseConnected && isOnline ? (
                <>
                  <Wifi className="w-3.5 h-3.5" />
                  <span>Real-time ออนไลน์</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5" />
                  <span>โหมดออฟไลน์/แคช</span>
                </>
              )}
            </div>

            {/* Quick Sync Sheets Button */}
            <button
              id="btn-sync-sheets"
              onClick={onSyncSheets}
              disabled={isSyncingSheets}
              className="px-2.5 sm:px-3 py-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-all cursor-pointer"
              title="ดึงข้อมูลจาก Google Sheets"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${isSyncingSheets ? 'animate-spin' : ''}`} />
              <span className="hidden lg:inline">ดึง Sheets</span>
            </button>

            {/* Load Test Data button */}
            <button
              id="btn-load-test-data"
              onClick={onLoadTestData}
              className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
              title="กดเพื่อจำลองข้อมูลรายการพัสดุสำหรับทดลองนำไปตรวจได้ทันที"
            >
              <Sparkles className="w-3.5 h-3.5 text-slate-950" />
              <span className="hidden sm:inline">โหลดข้อมูลทดสอบ</span>
            </button>

            {/* Inspector Name display */}
            <div
              onClick={onOpenSettings}
              className="hidden 2xl:flex items-center gap-1.5 px-2.5 py-1 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs text-slate-300 cursor-pointer transition-colors"
              title="คลิกเพื่อเปลี่ยนชื่อผู้ตรวจ"
            >
              <UserCheck className="w-3.5 h-3.5 text-blue-400" />
              <span className="max-w-[110px] truncate font-medium">{config.inspectorName}</span>
            </div>

            {/* Settings button */}
            <button
              id="btn-open-settings"
              onClick={onOpenSettings}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="ตั้งค่าระบบ"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
