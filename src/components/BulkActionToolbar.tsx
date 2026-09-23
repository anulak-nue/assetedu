import React, { useState } from 'react';
import {
  CheckSquare,
  X,
  Users,
  CheckCircle2,
  AlertTriangle,
  PackageCheck,
  XCircle,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { AssetStatus } from '../types';

interface BulkActionToolbarProps {
  selectedCount: number;
  totalVisibleCount: number;
  availableTeams: string[];
  onSelectAllVisible: () => void;
  onClearSelection: () => void;
  onBulkUpdateStatus: (newStatus: AssetStatus) => void;
  onBulkAssignTeam: (newTeam: string) => void;
}

export const BulkActionToolbar: React.FC<BulkActionToolbarProps> = ({
  selectedCount,
  totalVisibleCount,
  availableTeams,
  onSelectAllVisible,
  onClearSelection,
  onBulkUpdateStatus,
  onBulkAssignTeam,
}) => {
  const [customTeam, setCustomTeam] = useState('');
  const [isTeamDropdownOpen, setIsTeamDropdownOpen] = useState(false);

  if (selectedCount === 0) return null;

  return (
    <aside
      id="bulk-action-toolbar"
      aria-label="เครื่องมือจัดการหลายรายการพร้อมกัน"
      className="bg-slate-900 text-white rounded-xl shadow-xl border border-slate-700/80 p-3 sm:p-3.5 mb-3 animate-in fade-in slide-in-from-top-2 duration-200"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Left: Selection Counter & Quick Select */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2 bg-blue-600/30 border border-blue-500/40 text-blue-200 px-3 py-1.5 rounded-lg text-xs font-semibold">
            <CheckSquare className="w-4 h-4 text-blue-400" />
            <span>
              เลือกอยู่ <strong className="text-white font-mono text-sm">{selectedCount}</strong> รายการ
            </span>
          </div>

          <button
            type="button"
            id="btn-select-all-visible"
            onClick={onSelectAllVisible}
            className="text-xs text-slate-300 hover:text-white underline decoration-slate-500 hover:decoration-white font-medium py-1 px-1.5 transition-colors cursor-pointer"
          >
            เลือกทั้งหมดในหน้านี้ ({totalVisibleCount})
          </button>

          <button
            type="button"
            id="btn-clear-selection"
            onClick={onClearSelection}
            className="text-xs text-slate-400 hover:text-rose-300 flex items-center gap-1 py-1 px-1.5 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>ยกเลิกการเลือก</span>
          </button>
        </div>

        {/* Right: Bulk Status & Team actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Quick Buttons */}
          <div className="flex items-center gap-1.5 bg-slate-800/90 p-1 rounded-lg border border-slate-700">
            <span className="text-[11px] text-slate-400 px-2 font-medium hidden sm:inline">เปลี่ยนสถานะ:</span>
            
            <button
              type="button"
              id="bulk-btn-found"
              onClick={() => onBulkUpdateStatus('found')}
              className="px-2.5 py-1.5 rounded-md text-xs font-semibold bg-emerald-600/80 hover:bg-emerald-600 text-white flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
              title="เปลี่ยนเป็น ใช้งานได้ (พบ)"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>ใช้งานได้</span>
            </button>

            <button
              type="button"
              id="bulk-btn-broken"
              onClick={() => onBulkUpdateStatus('broken')}
              className="px-2.5 py-1.5 rounded-md text-xs font-semibold bg-amber-600/80 hover:bg-amber-600 text-white flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
              title="เปลี่ยนเป็น ชำรุด"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>ชำรุด</span>
            </button>

            <button
              type="button"
              id="bulk-btn-deteriorated"
              onClick={() => onBulkUpdateStatus('deteriorated')}
              className="px-2.5 py-1.5 rounded-md text-xs font-semibold bg-orange-600/80 hover:bg-orange-600 text-white flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
              title="เปลี่ยนเป็น เสื่อมสภาพ"
            >
              <PackageCheck className="w-3.5 h-3.5" />
              <span>เสื่อมสภาพ</span>
            </button>

            <button
              type="button"
              id="bulk-btn-missing"
              onClick={() => onBulkUpdateStatus('missing')}
              className="px-2.5 py-1.5 rounded-md text-xs font-semibold bg-rose-700/80 hover:bg-rose-700 text-white flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
              title="เปลี่ยนเป็น ตรวจไม่พบ"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>ตรวจไม่พบ</span>
            </button>

            <button
              type="button"
              id="bulk-btn-pending"
              onClick={() => onBulkUpdateStatus('pending')}
              className="px-2 py-1.5 rounded-md text-xs font-semibold bg-slate-700 hover:bg-slate-600 text-slate-300 flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
              title="รีเซ็ตเป็น ยังไม่ตรวจ"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden sm:inline">ยังไม่ตรวจ</span>
            </button>
          </div>

          {/* Bulk Team Assignment */}
          <div className="relative flex items-center gap-1 bg-slate-800/90 p-1 rounded-lg border border-slate-700">
            <span className="text-[11px] text-slate-400 px-2 font-medium hidden sm:inline">
              <Users className="w-3.5 h-3.5 inline mr-1 text-slate-400" />
              กำหนดทีม:
            </span>

            <select
              id="bulk-team-select"
              aria-label="เลือกทีมตรวจสำหรับรายการที่เลือก"
              onChange={(e) => {
                if (e.target.value === '__custom__') {
                  setIsTeamDropdownOpen(true);
                } else if (e.target.value) {
                  onBulkAssignTeam(e.target.value);
                  e.target.value = '';
                }
              }}
              defaultValue=""
              className="bg-slate-900 border border-slate-600 text-white text-xs rounded-md px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-blue-400 cursor-pointer"
            >
              <option value="" disabled>-- เลือกทีม --</option>
              {availableTeams.map((t) => (
                <option key={t} value={t}>
                  ทีม {t}
                </option>
              ))}
              <option value="__custom__">+ ระบุชื่อทีมใหม่...</option>
              <option value="__clear__">ลบทีมออก (เว้นว่าง)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Optional custom team name input popup/row */}
      {isTeamDropdownOpen && (
        <div className="mt-2.5 pt-2.5 border-t border-slate-800 flex items-center gap-2 text-xs">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-slate-300 font-medium">ระบุชื่อทีมตรวจใหม่:</span>
          <input
            type="text"
            id="bulk-custom-team-input"
            value={customTeam}
            onChange={(e) => setCustomTeam(e.target.value)}
            placeholder="เช่น AV, IT, Support, ทีม 1"
            className="px-2.5 py-1 bg-slate-800 border border-slate-600 rounded text-white text-xs outline-none focus:ring-1 focus:ring-blue-400"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && customTeam.trim()) {
                onBulkAssignTeam(customTeam.trim());
                setCustomTeam('');
                setIsTeamDropdownOpen(false);
              }
            }}
          />
          <button
            type="button"
            id="btn-confirm-custom-team"
            onClick={() => {
              if (customTeam.trim()) {
                onBulkAssignTeam(customTeam.trim());
                setCustomTeam('');
                setIsTeamDropdownOpen(false);
              }
            }}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded text-xs transition-colors cursor-pointer"
          >
            ใช้ชื่อทีมนี้
          </button>
          <button
            type="button"
            onClick={() => setIsTeamDropdownOpen(false)}
            className="text-slate-400 hover:text-white px-1.5 py-1 text-xs cursor-pointer"
          >
            ยกเลิก
          </button>
        </div>
      )}
    </aside>
  );
};
