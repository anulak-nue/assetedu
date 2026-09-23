import React, { useState } from 'react';
import { X, PlusCircle, Sparkles, Building, DoorOpen, Users, CheckCircle2 } from 'lucide-react';
import { AssetItem, AssetStatus } from '../types';

interface AddAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddAsset: (asset: AssetItem) => void;
  availableLocations: string[];
  availableRooms: string[];
  availableTeams: string[];
  inspectorName: string;
}

export const AddAssetModal: React.FC<AddAssetModalProps> = ({
  isOpen,
  onClose,
  onAddAsset,
  availableLocations,
  availableRooms,
  availableTeams,
  inspectorName,
}) => {
  if (!isOpen) return null;

  const [sapNo, setSapNo] = useState('');
  const [name, setName] = useState('');
  const [location, setLocation] = useState(availableLocations[0] || 'อาคารบริหารส่วนกลาง');
  const [customLocation, setCustomLocation] = useState('');
  const [room, setRoom] = useState(availableRooms[0] || 'ห้อง 101');
  const [customRoom, setCustomRoom] = useState('');
  const [serialNo, setSerialNo] = useState('');
  const [team, setTeam] = useState(availableTeams[0] || 'ทีม AV/IT');
  const [customTeam, setCustomTeam] = useState('');
  const [status, setStatus] = useState<AssetStatus>('found');
  const [note, setNote] = useState('');
  const [returnedTo, setReturnedTo] = useState('');
  const [requestSticker, setRequestSticker] = useState(false);

  // Generate a random SAP number if user doesn't know it
  const handleGenerateSap = () => {
    const year = (new Date().getFullYear() + 543).toString().slice(-2);
    const rand = Math.floor(1000 + Math.random() * 9000);
    setSapNo(`4120-${rand}/` + year);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const finalSap = sapNo.trim() || `ITEM-${Date.now().toString().slice(-6)}`;
    const finalLoc = location === '__other__' ? customLocation.trim() || '-' : location;
    const finalRoom = room === '__other__' ? customRoom.trim() || '-' : room;
    const finalTeam = team === '__other__' ? customTeam.trim() : team;

    const newAsset: AssetItem = {
      id: finalSap,
      sapNo: finalSap,
      name: name.trim(),
      location: finalLoc,
      room: finalRoom,
      serialNo: serialNo.trim() || '-',
      team: finalTeam,
      status: status,
      invalidDepartment: false,
      invalidLocation: false,
      invalidModel: false,
      note: note.trim(),
      returnedTo: returnedTo,
      requestSticker: requestSticker,
      updatedBy: inspectorName || 'ผู้ตรวจ',
      updatedAt: new Date().toISOString(),
    };

    onAddAsset(newAsset);
    onClose();
  };

  return (
    <div
      id="add-asset-modal"
      className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[92vh] border border-slate-200">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <PlusCircle className="w-4 h-4 text-emerald-400" />
            <span>เพิ่มรายการครุภัณฑ์ใหม่</span>
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 overflow-y-auto flex-1 text-xs">
          {/* SAP No */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-slate-700 uppercase tracking-wider">
                หมายเลขครุภัณฑ์ (SAP No.)
              </label>
              <button
                type="button"
                onClick={handleGenerateSap}
                className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>สร้างรหัสสุ่ม</span>
              </button>
            </div>
            <input
              type="text"
              value={sapNo}
              onChange={(e) => setSapNo(e.target.value)}
              placeholder="เช่น 4120-001-0001/67"
              className="w-full border border-slate-300 rounded-lg p-2.5 font-mono text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
            />
          </div>

          {/* Asset Name / Description */}
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              รายละเอียด / ชื่อครุภัณฑ์ <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="เช่น เครื่องคอมพิวเตอร์ All-in-One Dell OptiPlex..."
              className="w-full border border-slate-300 rounded-lg p-2.5 text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
            />
          </div>

          {/* Location & Room */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                <span>สถานที่ตั้ง</span>
              </label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-slate-50 focus:bg-white outline-none"
              >
                {availableLocations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
                <option value="__other__">+ ระบุสถานที่อื่น...</option>
              </select>
              {location === '__other__' && (
                <input
                  type="text"
                  value={customLocation}
                  onChange={(e) => setCustomLocation(e.target.value)}
                  placeholder="พิมพ์สถานที่ตั้ง..."
                  className="w-full mt-1.5 border border-slate-300 rounded-lg p-2 text-xs bg-white outline-none"
                  required
                />
              )}
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                <DoorOpen className="w-3.5 h-3.5 text-slate-400" />
                <span>ห้อง</span>
              </label>
              <select
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-slate-50 focus:bg-white outline-none"
              >
                {availableRooms.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
                <option value="__other__">+ ระบุห้องอื่น...</option>
              </select>
              {room === '__other__' && (
                <input
                  type="text"
                  value={customRoom}
                  onChange={(e) => setCustomRoom(e.target.value)}
                  placeholder="พิมพ์ห้อง..."
                  className="w-full mt-1.5 border border-slate-300 rounded-lg p-2 text-xs bg-white outline-none"
                  required
                />
              )}
            </div>
          </div>

          {/* Serial No & Team */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Serial No.
              </label>
              <input
                type="text"
                value={serialNo}
                onChange={(e) => setSerialNo(e.target.value)}
                placeholder="เช่น SN-DELL-88491"
                className="w-full border border-slate-300 rounded-lg p-2 font-mono text-xs bg-slate-50 focus:bg-white outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <span>ทีมตรวจ</span>
              </label>
              <select
                value={team}
                onChange={(e) => setTeam(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-slate-50 focus:bg-white outline-none"
              >
                {availableTeams.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
                <option value="__other__">+ ระบุทีมใหม่...</option>
              </select>
              {team === '__other__' && (
                <input
                  type="text"
                  value={customTeam}
                  onChange={(e) => setCustomTeam(e.target.value)}
                  placeholder="พิมพ์ชื่อทีม..."
                  className="w-full mt-1.5 border border-slate-300 rounded-lg p-2 text-xs bg-white outline-none"
                  required
                />
              )}
            </div>
          </div>

          {/* Initial Status */}
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              สถานะผลตรวจ
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'found', label: '✅ ใช้งานได้', color: 'emerald' },
                { id: 'broken', label: '⚠️ ชำรุด', color: 'rose' },
                { id: 'deteriorated', label: '📦 เสื่อมสภาพ', color: 'purple' },
                { id: 'missing', label: '❌ ไม่พบ', color: 'red' },
              ].map((s) => (
                <button
                  type="button"
                  key={s.id}
                  onClick={() => setStatus(s.id as AssetStatus)}
                  className={`p-2 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                    status === s.id
                      ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-xs ring-1 ring-blue-500'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Request Sticker Checkbox */}
          <label className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100">
            <input
              type="checkbox"
              checked={requestSticker}
              onChange={(e) => setRequestSticker(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600"
            />
            <span className="font-bold text-blue-900">🏷️ ขอรับป้ายสติ๊กเกอร์บาร์โค้ดใหม่</span>
          </label>

          {/* Return To & Note */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                การส่งคืน
              </label>
              <select
                value={returnedTo}
                onChange={(e) => setReturnedTo(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-slate-50 focus:bg-white outline-none"
              >
                <option value="">-- ไม่ส่งคืน --</option>
                <option value="คืนงานพัสดุ">คืนงานพัสดุ</option>
                <option value="คืนงานไอที">คืนงานไอที</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                หมายเหตุ / สาเหตุ
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="ระบุหมายเหตุหรือสาเหตุ..."
                className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-slate-50 focus:bg-white outline-none"
              />
            </div>
          </div>

          {/* Footer buttons */}
          <div className="bg-slate-50 -mx-5 -mb-5 px-5 py-3 border-t border-slate-200 flex justify-end gap-2 flex-shrink-0 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs active:scale-95 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>เพิ่มครุภัณฑ์</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
