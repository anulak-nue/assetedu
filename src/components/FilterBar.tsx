import React, { useRef } from 'react';
import {
  Search,
  Mic,
  QrCode,
  FileSpreadsheet,
  Users,
  Download,
  X,
  Building,
  DoorOpen,
  HardDrive,
  PlusCircle,
} from 'lucide-react';

interface FilterBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedLocation: string;
  onLocationChange: (value: string) => void;
  availableLocations: string[];
  selectedRoom: string;
  onRoomChange: (value: string) => void;
  availableRooms: string[];
  selectedTeam: string;
  onTeamChange: (value: string) => void;
  availableTeams: string[];
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  onOpenQrScanner: () => void;
  onStartVoiceSearch: () => void;
  isListening: boolean;
  onImportAssetsCsv: (file: File) => void;
  onImportTeamsCsv: (file: File) => void;
  onExportCsv: () => void;
  onOpenGoogleWorkspace?: () => void;
  onOpenAddAsset?: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchTerm,
  onSearchChange,
  selectedLocation,
  onLocationChange,
  availableLocations,
  selectedRoom,
  onRoomChange,
  availableRooms,
  selectedTeam,
  onTeamChange,
  availableTeams,
  statusFilter,
  onStatusFilterChange,
  onOpenQrScanner,
  onStartVoiceSearch,
  isListening,
  onImportAssetsCsv,
  onImportTeamsCsv,
  onExportCsv,
  onOpenGoogleWorkspace,
  onOpenAddAsset,
}) => {
  const assetFileInputRef = useRef<HTMLInputElement>(null);
  const teamFileInputRef = useRef<HTMLInputElement>(null);

  const filterButtons = [
    { id: 'all', label: 'ทั้งหมด' },
    { id: 'pending', label: '⏳ ยังไม่ตรวจ' },
    { id: 'found', label: '✅ ใช้งานได้' },
    { id: 'broken', label: '⚠️ ชำรุด' },
    { id: 'deteriorated', label: '📦 เสื่อมสภาพ' },
    { id: 'missing', label: '❌ ตรวจไม่พบ' },
    { id: 'invalid-registry', label: '📝 ทะเบียนผิด' },
    { id: 'sticker', label: '🏷️ ขอป้ายใหม่' },
    { id: 'return-supply', label: '📦 คืนพัสดุ' },
    { id: 'return-it', label: '💻 คืนไอที' },
  ];

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-4 mb-4 sm:mb-6 space-y-3.5">
      {/* Search and Dropdowns Row */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 sm:gap-3">
        {/* Search input with camera and mic */}
        <div className="md:col-span-5">
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
            ค้นหา (รหัส SAP / ชื่อพัสดุ / สถานที่ตั้ง / S/N)
          </label>
          <div className="relative flex items-center">
            <Search className="w-4 h-4 absolute left-3 text-slate-400 pointer-events-none" />
            <input
              id="search-input"
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="พิมพ์รหัส SAP, ชื่อพัสดุ, สถานที่..."
              className="w-full pl-9 pr-20 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all"
            />
            <div className="absolute right-1.5 flex items-center gap-0.5">
              {searchTerm && (
                <button
                  onClick={() => onSearchChange('')}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-md cursor-pointer"
                  title="ล้างข้อความค้นหา"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                id="btn-voice-search"
                onClick={onStartVoiceSearch}
                className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                  isListening
                    ? 'text-rose-600 bg-rose-50 animate-pulse'
                    : 'text-slate-400 hover:text-blue-600 hover:bg-slate-100'
                }`}
                title="ค้นหาด้วยเสียงพูด (Voice Search)"
              >
                <Mic className="w-4 h-4" />
              </button>
              <button
                type="button"
                id="btn-camera-scan"
                onClick={onOpenQrScanner}
                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                title="สแกนบาร์โค้ด / QR Code ด้วยกล้อง"
              >
                <QrCode className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Location Dropdown */}
        <div className="md:col-span-3">
          <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
            <Building className="w-3 h-3 text-slate-400" />
            <span>กรองตามสถานที่ตั้ง</span>
          </label>
          <select
            id="location-filter"
            value={selectedLocation}
            onChange={(e) => onLocationChange(e.target.value)}
            className="w-full py-2 px-2.5 border border-slate-300 rounded-lg text-xs bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all truncate cursor-pointer"
          >
            <option value="all">-- ทุกสถานที่ตั้ง ({availableLocations.length} แห่ง) --</option>
            {availableLocations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>

        {/* Room Dropdown (Cascaded from location) */}
        <div className="md:col-span-2">
          <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
            <DoorOpen className="w-3 h-3 text-slate-400" />
            <span>กรองตามห้อง (อ้างอิงสถานที่)</span>
          </label>
          <select
            id="room-filter"
            value={selectedRoom}
            onChange={(e) => onRoomChange(e.target.value)}
            className="w-full py-2 px-2.5 border border-slate-300 rounded-lg text-xs bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all truncate cursor-pointer"
          >
            <option value="all">-- ทุกห้อง ({availableRooms.length} ห้อง) --</option>
            {availableRooms.map((room) => (
              <option key={room} value={room}>
                {room}
              </option>
            ))}
          </select>
        </div>

        {/* Team Dropdown */}
        <div className="md:col-span-2">
          <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
            <Users className="w-3 h-3 text-slate-400" />
            <span>ทีมตรวจ</span>
          </label>
          <select
            id="team-filter"
            value={selectedTeam}
            onChange={(e) => onTeamChange(e.target.value)}
            className="w-full py-2 px-2.5 border border-slate-300 rounded-lg text-xs bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all truncate cursor-pointer"
          >
            <option value="all">-- ทุกทีมตรวจ --</option>
            {availableTeams.map((team) => (
              <option key={team} value={team}>
                {team}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Buttons row: Status filters and CSV / Google Workspace actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-3 border-t border-slate-100">
        {/* Status Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {filterButtons.map((btn) => {
            const isSelected = statusFilter === btn.id;
            return (
              <button
                key={btn.id}
                id={`filter-btn-${btn.id}`}
                onClick={() => onStatusFilterChange(btn.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95 cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? 'bg-blue-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800'
                }`}
              >
                {btn.label}
              </button>
            );
          })}
        </div>

        {/* Import/Export Actions including Google Sheets & Drive */}
        <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
          {onOpenAddAsset && (
            <button
              type="button"
              id="btn-open-add-asset"
              onClick={onOpenAddAsset}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs active:scale-95 transition-all cursor-pointer"
              title="เพิ่มรายการครุภัณฑ์ใหม่เข้าสู่ระบบ"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>เพิ่มพัสดุ</span>
            </button>
          )}

          {onOpenGoogleWorkspace && (
            <button
              type="button"
              id="filter-btn-google-workspace"
              onClick={onOpenGoogleWorkspace}
              className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs active:scale-95 transition-all cursor-pointer"
              title="จัดการ Google Sheets และ Google Drive"
            >
              <div className="flex items-center -space-x-1">
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" />
                <HardDrive className="w-3.5 h-3.5 text-blue-200" />
              </div>
              <span>Google Sheets & Drive</span>
            </button>
          )}

          <input
            type="file"
            ref={assetFileInputRef}
            accept=".csv"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                onImportAssetsCsv(e.target.files[0]);
                e.target.value = '';
              }
            }}
          />
          <button
            id="btn-import-assets-csv"
            onClick={() => assetFileInputRef.current?.click()}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs active:scale-95 transition-all cursor-pointer"
            title="นำเข้าไฟล์ CSV รายการพัสดุ 22 คอลัมน์"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>นำเข้า CSV</span>
          </button>

          <input
            type="file"
            ref={teamFileInputRef}
            accept=".csv"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                onImportTeamsCsv(e.target.files[0]);
                e.target.value = '';
              }
            }}
          />
          <button
            id="btn-import-teams-csv"
            onClick={() => teamFileInputRef.current?.click()}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs active:scale-95 transition-all cursor-pointer"
            title="นำเข้าไฟล์ CSV เพื่อกำหนดทีมตรวจให้อัตโนมัติตามรหัส SAP"
          >
            <Users className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">นำเข้าทีมตรวจ</span>
          </button>

          <button
            id="btn-export-csv"
            onClick={onExportCsv}
            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs active:scale-95 transition-all cursor-pointer"
            title="ส่งออกรายงานผลการตรวจครุภัณฑ์เป็นไฟล์ CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>ส่งออก CSV</span>
          </button>
        </div>
      </div>
    </div>
  );
};
