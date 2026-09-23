import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  PackageOpen,
  XCircle,
  QrCode,
  MapPin,
  Save,
  Clock,
  User,
  Users,
  RotateCcw,
} from 'lucide-react';
import { AssetItem, AssetStatus } from '../types';

interface InspectionModalProps {
  asset: AssetItem | null;
  inspectorName: string;
  onClose: () => void;
  onSave: (updatedAsset: AssetItem) => void;
}

export const InspectionModal: React.FC<InspectionModalProps> = ({
  asset,
  inspectorName,
  onClose,
  onSave,
}) => {
  if (!asset) return null;

  const [status, setStatus] = useState<AssetStatus>(
    asset.status === 'pending' ? 'found' : asset.status
  );
  const [invalidDepartment, setInvalidDepartment] = useState<boolean>(asset.invalidDepartment);
  const [invalidLocation, setInvalidLocation] = useState<boolean>(asset.invalidLocation);
  const [invalidModel, setInvalidModel] = useState<boolean>(asset.invalidModel);
  const [requestSticker, setRequestSticker] = useState<boolean>(asset.requestSticker);
  const [team, setTeam] = useState<string>(asset.team || '');
  const [returnedTo, setReturnedTo] = useState<string>(asset.returnedTo || '');
  const [note, setNote] = useState<string>(asset.note || '');

  useEffect(() => {
    if (asset) {
      setStatus(asset.status === 'pending' ? 'found' : asset.status);
      setInvalidDepartment(asset.invalidDepartment);
      setInvalidLocation(asset.invalidLocation);
      setInvalidModel(asset.invalidModel);
      setRequestSticker(asset.requestSticker);
      setTeam(asset.team || '');
      setReturnedTo(asset.returnedTo || '');
      setNote(asset.note || '');
    }
  }, [asset]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: AssetItem = {
      ...asset,
      status,
      invalidDepartment,
      invalidLocation,
      invalidModel,
      requestSticker,
      team: team.trim(),
      returnedTo: returnedTo.trim(),
      note: note.trim(),
      updatedBy: inspectorName || 'ผู้ตรวจ',
      updatedAt: new Date().toISOString(),
    };
    onSave(updated);
  };

  return (
    <div
      id="inspection-modal"
      className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 transition-all"
    >
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh] border border-slate-200">
        {/* Modal Header */}
        <div className="bg-slate-900 px-5 py-3.5 flex justify-between items-center text-white flex-shrink-0 border-b border-slate-800">
          <div>
            <h3 className="font-bold text-base leading-snug font-heading flex items-center gap-2">
              <span>อัปเดตผลการตรวจสอบพัสดุ</span>
            </h3>
            <p className="text-[11px] text-slate-300">
              บันทึกผลการตรวจสอบและข้อมูลความถูกต้องของทะเบียน
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Asset Info Card */}
          <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-1 text-xs">
            <div className="flex items-center justify-between text-slate-500 text-[11px]">
              <span>
                รหัส SAP:{' '}
                <strong className="text-slate-900 font-mono text-sm">{asset.sapNo}</strong>
              </span>
              {asset.budgetYear && <span>ปีงบ: {asset.budgetYear}</span>}
            </div>
            <div className="font-bold text-slate-800 text-sm leading-snug">{asset.name}</div>
            <div className="text-slate-600 flex flex-wrap items-center gap-2 pt-0.5">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-red-500" />
                {asset.location}
              </span>
              <span>• ห้อง: <strong>{asset.room}</strong></span>
              {asset.serialNo && asset.serialNo !== '-' && (
                <span>• S/N: <span className="font-mono">{asset.serialNo}</span></span>
              )}
            </div>
          </div>

          {/* Section 1: Inspection Status */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              1. ระบุสถานะผลการตรวจ <span className="text-rose-500">* (เลือก 1 ข้อ)</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                id="modal-status-found"
                onClick={() => setStatus('found')}
                className={`p-2.5 border-2 rounded-xl text-center transition-all cursor-pointer ${
                  status === 'found'
                    ? 'border-emerald-500 bg-emerald-50/80 shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <CheckCircle2
                  className={`w-5 h-5 mx-auto mb-1 ${
                    status === 'found' ? 'text-emerald-600' : 'text-slate-400'
                  }`}
                />
                <span className="text-xs font-bold block text-slate-800">ใช้งานได้ (พบ)</span>
              </button>

              <button
                type="button"
                id="modal-status-broken"
                onClick={() => setStatus('broken')}
                className={`p-2.5 border-2 rounded-xl text-center transition-all cursor-pointer ${
                  status === 'broken'
                    ? 'border-amber-500 bg-amber-50/80 shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <AlertTriangle
                  className={`w-5 h-5 mx-auto mb-1 ${
                    status === 'broken' ? 'text-amber-600' : 'text-slate-400'
                  }`}
                />
                <span className="text-xs font-bold block text-slate-800">ชำรุด</span>
              </button>

              <button
                type="button"
                id="modal-status-deteriorated"
                onClick={() => setStatus('deteriorated')}
                className={`p-2.5 border-2 rounded-xl text-center transition-all cursor-pointer ${
                  status === 'deteriorated'
                    ? 'border-orange-500 bg-orange-50/80 shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <PackageOpen
                  className={`w-5 h-5 mx-auto mb-1 ${
                    status === 'deteriorated' ? 'text-orange-600' : 'text-slate-400'
                  }`}
                />
                <span className="text-xs font-bold block text-slate-800">เสื่อมสภาพ</span>
              </button>

              <button
                type="button"
                id="modal-status-missing"
                onClick={() => setStatus('missing')}
                className={`p-2.5 border-2 rounded-xl text-center transition-all cursor-pointer ${
                  status === 'missing'
                    ? 'border-rose-500 bg-rose-50/80 shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <XCircle
                  className={`w-5 h-5 mx-auto mb-1 ${
                    status === 'missing' ? 'text-rose-600' : 'text-slate-400'
                  }`}
                />
                <span className="text-xs font-bold block text-slate-800">ตรวจไม่พบ</span>
              </button>
            </div>
          </div>

          {/* Section 2: ข้อมูลทะเบียนครุภัณฑ์ไม่ถูกต้อง */}
          <div className="bg-indigo-50/50 p-3.5 rounded-xl border border-indigo-100">
            <label className="block text-xs font-bold text-indigo-900 uppercase tracking-wider mb-2">
              2. ข้อมูลทะเบียนครุภัณฑ์ไม่ถูกต้อง <span className="text-indigo-600 font-normal">(เลือกได้มากกว่า 1 ข้อ)</span>
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2.5 p-2 bg-white border border-indigo-100 rounded-lg cursor-pointer hover:border-indigo-300 text-xs font-medium text-slate-700 select-none">
                <input
                  type="checkbox"
                  id="chk-invalid-dept"
                  checked={invalidDepartment}
                  onChange={(e) => setInvalidDepartment(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <span>หน่วยงานผู้ถือครองไม่ถูกต้อง</span>
              </label>

              <label className="flex items-center gap-2.5 p-2 bg-white border border-indigo-100 rounded-lg cursor-pointer hover:border-indigo-300 text-xs font-medium text-slate-700 select-none">
                <input
                  type="checkbox"
                  id="chk-invalid-loc"
                  checked={invalidLocation}
                  onChange={(e) => setInvalidLocation(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <span>สถานที่ตั้งไม่ถูกต้อง</span>
              </label>

              <label className="flex items-center gap-2.5 p-2 bg-white border border-indigo-100 rounded-lg cursor-pointer hover:border-indigo-300 text-xs font-medium text-slate-700 select-none">
                <input
                  type="checkbox"
                  id="chk-invalid-model"
                  checked={invalidModel}
                  onChange={(e) => setInvalidModel(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <span>ไม่มียี่ห้อ/รุ่น หรือมีแต่ไม่ถูกต้อง</span>
              </label>
            </div>
          </div>

          {/* Section 3: ขอรับป้ายสติ๊กเกอร์ */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              3. ขอรับป้ายสติ๊กเกอร์
            </label>
            <label className="flex items-center justify-between p-3 border border-pink-200 bg-pink-50/50 rounded-xl cursor-pointer select-none hover:bg-pink-50 transition-colors">
              <span className="text-xs font-bold text-pink-900 flex items-center gap-2">
                <QrCode className="w-4 h-4 text-pink-600" />
                <span>ขอรับป้ายสติ๊กเกอร์บาร์โค้ดใหม่</span>
              </span>
              <input
                type="checkbox"
                id="chk-request-sticker"
                checked={requestSticker}
                onChange={(e) => setRequestSticker(e.target.checked)}
                className="w-4 h-4 text-pink-600 rounded border-slate-300 focus:ring-pink-500"
              />
            </label>
          </div>

          {/* Section 4: สถานะการส่งคืนพัสดุ */}
          <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <RotateCcw className="w-3.5 h-3.5 text-purple-600" />
              <span>4. สถานะการส่งคืนพัสดุ</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setReturnedTo('')}
                className={`py-2 px-2.5 rounded-lg border text-xs font-semibold text-center transition-all cursor-pointer ${
                  !returnedTo
                    ? 'bg-white border-slate-400 text-slate-800 shadow-xs'
                    : 'bg-white/50 border-slate-200 text-slate-500 hover:bg-white'
                }`}
              >
                ไม่ส่งคืน (ปกติ)
              </button>
              <button
                type="button"
                onClick={() => setReturnedTo('พัสดุ')}
                className={`py-2 px-2.5 rounded-lg border text-xs font-semibold text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  returnedTo.includes('พัสดุ')
                    ? 'bg-purple-100 border-purple-400 text-purple-900 shadow-xs'
                    : 'bg-white/50 border-slate-200 text-slate-600 hover:bg-purple-50'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                <span>คืนพัสดุคณะฯ</span>
              </button>
              <button
                type="button"
                onClick={() => setReturnedTo('สารสนเทศ')}
                className={`py-2 px-2.5 rounded-lg border text-xs font-semibold text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  returnedTo.includes('สารสนเทศ') || returnedTo.toLowerCase().includes('it')
                    ? 'bg-sky-100 border-sky-400 text-sky-900 shadow-xs'
                    : 'bg-white/50 border-slate-200 text-slate-600 hover:bg-sky-50'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-sky-600"></span>
                <span>คืนสารสนเทศฯ (IT)</span>
              </button>
            </div>
          </div>

          {/* Section 5: ทีมตรวจ */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <span>5. ทีมตรวจ</span>
            </label>
            <input
              type="text"
              id="modal-input-team"
              value={team}
              onChange={(e) => setTeam(e.target.value)}
              placeholder="ระบุชื่อทีมตรวจ เช่น AV, IT, support"
              className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
            />
          </div>

          {/* Section 6: หมายเหตุ / สาเหตุ / รายละเอียดที่ต้องแก้ไข */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              6. ระบุสาเหตุของสถานะครุภัณฑ์ หรือรายละเอียดที่ต้องแก้ไข
            </label>
            <textarea
              id="modal-input-note"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="เช่น ย้ายสถานที่ตั้งไปห้อง 302, ชำรุดเปิดไม่ติด, ไม่พบตัวเครื่องในห้อง..."
              className="w-full border border-slate-300 rounded-xl p-3 text-sm bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
            />
          </div>

          {/* Footer details */}
          <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-100">
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />
              <span>ผู้ตรวจ: <strong>{inspectorName}</strong></span>
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>บันทึกแบบ Real-time</span>
            </span>
          </div>

          {/* Action buttons */}
          <div className="bg-slate-50 -mx-5 -mb-5 px-5 py-3.5 border-t border-slate-200 flex justify-end gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 active:scale-95 transition-all"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              id="btn-save-inspection"
              className="px-5 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-sm active:scale-95 flex items-center gap-1.5 transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              <span>บันทึกผลการตรวจสอบ</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
