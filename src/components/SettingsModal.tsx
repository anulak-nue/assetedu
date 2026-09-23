import React, { useState } from 'react';
import {
  X,
  Settings,
  Save,
  RotateCcw,
  Trash2,
  Database,
  FileSpreadsheet,
  User,
  CheckCircle2,
} from 'lucide-react';
import { AppConfig } from '../types';
import { DEFAULT_CONFIG } from '../services/storage';
import { GasCodeModal } from './GasCodeModal';

interface SettingsModalProps {
  isOpen: boolean;
  config: AppConfig;
  totalAssetsCount: number;
  onClose: () => void;
  onSaveConfig: (newConfig: AppConfig) => void;
  onClearAllData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  config,
  totalAssetsCount,
  onClose,
  onSaveConfig,
  onClearAllData,
}) => {
  if (!isOpen) return null;

  const [inspectorName, setInspectorName] = useState(config.inspectorName);
  const [gasUrl, setGasUrl] = useState(config.gasWebAppUrl);
  const [fbJson, setFbJson] = useState(JSON.stringify(config.firebaseConfig, null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isGasModalOpen, setIsGasModalOpen] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setJsonError(null);
    try {
      const parsedFb = JSON.parse(fbJson);
      const newConfig: AppConfig = {
        inspectorName: inspectorName.trim() || 'ผู้ตรวจ',
        gasWebAppUrl: gasUrl.trim(),
        firebaseConfig: parsedFb,
      };
      onSaveConfig(newConfig);
      setIsSaved(true);
      setTimeout(() => {
        setIsSaved(false);
        onClose();
      }, 800);
    } catch (err) {
      setJsonError('รูปแบบ JSON ของ Firebase Config ไม่ถูกต้อง กรุณาตรวจสอบวงเล็บปีกกาและเครื่องหมายคำพูด');
    }
  };

  const handleResetDefaults = () => {
    if (window.confirm('คุณต้องการรีเซ็ตการตั้งค่าการเชื่อมต่อกลับเป็นค่าเริ่มต้นหรือไม่?')) {
      setInspectorName(DEFAULT_CONFIG.inspectorName);
      setGasUrl(DEFAULT_CONFIG.gasWebAppUrl);
      setFbJson(JSON.stringify(DEFAULT_CONFIG.firebaseConfig, null, 2));
      setJsonError(null);
    }
  };

  return (
    <div
      id="settings-modal"
      className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh] border border-slate-200">
        {/* Header */}
        <div className="bg-slate-900 px-5 py-3.5 flex justify-between items-center text-white border-b border-slate-800">
          <h3 className="font-bold text-sm font-heading flex items-center gap-2">
            <Settings className="w-4 h-4 text-blue-400" />
            <span>ตั้งค่าระบบและการเชื่อมต่อ</span>
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSave} className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Google Workspace Info Box */}
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs flex items-start gap-2.5">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Google Sheets & Drive Integration:</span>
              <p className="text-[11px] text-emerald-800 mt-0.5">
                ท่านสามารถกดปุ่ม <span className="font-semibold text-emerald-950">"Sheets & Drive"</span> ที่แถบเมนูด้านบน เพื่อเลือกเปิดสเปรดชีตจากไดรฟ์ นำเข้าพัสดุ ซิงค์ผลตรวจ หรือสำรองข้อมูลขึ้น Google Drive ได้โดยตรง
              </p>
            </div>
          </div>

          {/* User Name */}
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-blue-600" />
              <span>ชื่อผู้ตรวจ / ชื่อทีม (Inspector Name)</span>
            </label>
            <input
              type="text"
              id="cfg-inspector-name"
              value={inspectorName}
              onChange={(e) => setInspectorName(e.target.value)}
              placeholder="เช่น นายอนุรักษ์ (ทีม AV)"
              className="w-full border border-slate-300 rounded-lg p-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none text-sm"
              required
            />
            <p className="text-[11px] text-slate-500 mt-0.5">
              ชื่อนี้จะถูกบันทึกเป็นผู้ตรวจ (updatedBy) อัตโนมัติเมื่อกดบันทึกผล
            </p>
          </div>

          {/* Google Apps Script Web App URL */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Google Apps Script Web App URL (เชื่อมต่อ Google Sheet)</span>
              </label>
              <button
                type="button"
                id="btn-view-gas-code"
                onClick={() => setIsGasModalOpen(true)}
                className="text-[11px] text-emerald-700 hover:text-emerald-900 font-bold underline flex items-center gap-0.5 cursor-pointer"
              >
                <span>ดูโค้ด Code.gs &amp; Index.html</span>
              </button>
            </div>
            <input
              type="text"
              id="cfg-gas-url"
              value={gasUrl}
              onChange={(e) => setGasUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/.../exec"
              className="w-full border border-slate-300 rounded-lg p-2.5 font-mono text-[11px] bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
            />
            <p className="text-[11px] text-slate-500 mt-0.5">
              URL สคริปต์ Google Sheet เพื่อดึงและซิงค์ข้อมูลพัสดุ
            </p>
          </div>

          {/* Firebase Configuration */}
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Database className="w-3.5 h-3.5 text-amber-600" />
              <span>Firebase Config (JSON) เพื่อ Real-time Collaboration</span>
            </label>
            <textarea
              id="cfg-firebase-json"
              rows={6}
              value={fbJson}
              onChange={(e) => setFbJson(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2.5 font-mono text-[11px] bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
            />
            {jsonError ? (
              <p className="text-[11px] text-rose-600 mt-1 font-medium">{jsonError}</p>
            ) : (
              <p className="text-[11px] text-slate-500 mt-0.5">
                กำหนดค่าโปรเจกต์ Firebase Firestore สำหรับการทำงานพร้อมกันในทีมแบบทันทีทันใด
              </p>
            )}
          </div>

          {/* Danger zone / Data manager */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 py-1 px-2 rounded-md hover:bg-slate-100"
            >
              <RotateCcw className="w-3 h-3" />
              <span>คืนค่าเริ่มต้น</span>
            </button>

            <button
              type="button"
              id="btn-clear-inventory"
              onClick={() => {
                if (
                  window.confirm(
                    `คุณต้องการลบข้อมูลพัสดุทั้งหมด (${totalAssetsCount.toLocaleString()} รายการ) ออกจากฐานข้อมูลในเครื่องใช่หรือไม่?`
                  )
                ) {
                  onClearAllData();
                  onClose();
                }
              }}
              className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 flex items-center gap-1 py-1 px-2 rounded-md font-semibold"
            >
              <Trash2 className="w-3 h-3" />
              <span>ล้างฐานข้อมูล ({totalAssetsCount.toLocaleString()})</span>
            </button>
          </div>

          {/* Footer actions */}
          <div className="bg-slate-50 -mx-5 -mb-5 px-5 py-3 border-t border-slate-200 flex justify-end gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              ปิด
            </button>
            <button
              type="submit"
              id="btn-save-config"
              className={`px-5 py-2 text-white rounded-xl text-xs font-bold shadow-xs active:scale-95 flex items-center gap-1.5 transition-all ${
                isSaved ? 'bg-emerald-600' : 'bg-blue-900 hover:bg-blue-800'
              }`}
            >
              {isSaved ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>บันทึกเรียบร้อย!</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>บันทึกการตั้งค่า</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Google Apps Script Code Modal */}
      <GasCodeModal
        isOpen={isGasModalOpen}
        onClose={() => setIsGasModalOpen(false)}
      />
    </div>
  );
};
