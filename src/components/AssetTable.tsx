import React from 'react';
import {
  FileEdit,
  MapPin,
  ChevronLeft,
  ChevronRight,
  User,
  QrCode,
  AlertCircle,
  Package,
} from 'lucide-react';
import { AssetItem, AssetStatus } from '../types';

interface AssetTableProps {
  assets: AssetItem[];
  selectedAssetIds?: Set<string>;
  onToggleSelectAsset?: (assetId: string) => void;
  onToggleSelectAllVisible?: () => void;
  onQuickUpdateStatus: (assetId: string, status: AssetStatus) => void;
  onOpenInspectModal: (asset: AssetItem) => void;
  currentPage: number;
  pageSize: number;
  totalFilteredCount: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export const AssetTable: React.FC<AssetTableProps> = ({
  assets,
  selectedAssetIds = new Set<string>(),
  onToggleSelectAsset,
  onToggleSelectAllVisible,
  onQuickUpdateStatus,
  onOpenInspectModal,
  currentPage,
  pageSize,
  totalFilteredCount,
  onPageChange,
  onPageSizeChange,
}) => {
  const totalPages = Math.max(1, Math.ceil(totalFilteredCount / pageSize));
  const startItem = totalFilteredCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalFilteredCount);

  // Safe set reference
  const safeSelectedIds = selectedAssetIds || new Set<string>();

  // Check if all visible assets on the current page are selected
  const allVisibleSelected =
    assets.length > 0 && assets.every((a) => safeSelectedIds.has(a.id || a.sapNo));
  const someVisibleSelected =
    assets.some((a) => safeSelectedIds.has(a.id || a.sapNo)) && !allVisibleSelected;

  function getStatusBadgeStyle(status: AssetStatus) {
    switch (status) {
      case 'found':
        return 'bg-emerald-50 text-emerald-700 border-emerald-300 focus:ring-emerald-400';
      case 'broken':
        return 'bg-amber-50 text-amber-800 border-amber-300 focus:ring-amber-400';
      case 'deteriorated':
        return 'bg-orange-50 text-orange-800 border-orange-300 focus:ring-orange-400';
      case 'missing':
        return 'bg-rose-50 text-rose-800 border-rose-300 focus:ring-rose-400';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300 focus:ring-slate-400';
    }
  }

  function getReturnBadge(returnedTo?: string) {
    if (!returnedTo) return null;
    const r = returnedTo.toLowerCase();
    if (r.includes('พัสดุ') || r.includes('supply')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-purple-100 text-purple-800 border border-purple-200">
          <span className="dot-indicator dot-supply" />
          <span>คืนพัสดุคณะฯ</span>
        </span>
      );
    }
    if (r.includes('สารสนเทศ') || r.includes('it')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-sky-100 text-sky-800 border border-sky-200">
          <span className="dot-indicator dot-it" />
          <span>คืนสารสนเทศฯ</span>
        </span>
      );
    }
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 overflow-hidden flex flex-col">
      {/* Table scroll container */}
      <div className="overflow-x-auto min-h-[350px]">
        <table className="w-full text-left border-collapse text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider sticky top-0 z-10">
            <tr>
              {/* Checkbox Header */}
              <th className="py-3 px-3 w-10 text-center">
                <input
                  type="checkbox"
                  id="select-all-visible-checkbox"
                  aria-label="เลือกทุกรายการในหน้านี้"
                  checked={allVisibleSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someVisibleSelected;
                  }}
                  onChange={onToggleSelectAllVisible}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                />
              </th>
              <th className="py-3 px-2 w-12 text-center text-slate-400">#</th>
              <th className="py-3 px-3.5 whitespace-nowrap">หมายเลขครุภัณฑ์ (SAP)</th>
              <th className="py-3 px-3.5 min-w-[220px]">รายละเอียดพัสดุ / S/N</th>
              <th className="py-3 px-3.5 whitespace-nowrap">สถานที่ตั้งหลัก / ห้อง</th>
              <th className="py-3 px-3.5 whitespace-nowrap">ทีมตรวจ</th>
              <th className="py-3 px-3.5 whitespace-nowrap min-w-[170px]">สถานะผลการตรวจ</th>
              <th className="py-3 px-3.5 text-right whitespace-nowrap">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {assets.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-16 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Package className="w-10 h-10 text-slate-300" />
                    <p className="font-semibold text-sm">ไม่พบรายการครุภัณฑ์ตรงตามเงื่อนไข</p>
                    <p className="text-xs text-slate-400">ลองเปลี่ยนคำค้นหา หรือเลือกตัวกรองใหม่อีกครั้ง</p>
                  </div>
                </td>
              </tr>
            ) : (
              assets.map((asset, index) => {
                const rowNum = startItem + index;
                const assetKey = asset.id || asset.sapNo;
                const isSelected = safeSelectedIds.has(assetKey);
                const hasIssues =
                  asset.invalidDepartment || asset.invalidLocation || asset.invalidModel;
                const returnBadge = getReturnBadge(asset.returnedTo);

                return (
                  <tr
                    key={assetKey}
                    className={`transition-colors group ${
                      isSelected
                        ? 'bg-blue-50/70 hover:bg-blue-50'
                        : 'hover:bg-slate-50/80'
                    }`}
                  >
                    {/* Row Selection Checkbox */}
                    <td className="py-3 px-3 text-center">
                      <input
                        type="checkbox"
                        id={`checkbox-asset-${asset.sapNo}`}
                        aria-label={`เลือกครุภัณฑ์รหัส ${asset.sapNo}`}
                        checked={isSelected}
                        onChange={() => onToggleSelectAsset && onToggleSelectAsset(assetKey)}
                        className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                      />
                    </td>

                    {/* Index */}
                    <td className="py-3 px-2 text-center text-xs text-slate-400 font-mono">
                      {rowNum}
                    </td>

                    {/* SAP Number */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        {asset.returnedTo && (
                          <span
                            className={`dot-indicator ${
                              asset.returnedTo.toLowerCase().includes('it') ? 'dot-it' : 'dot-supply'
                            }`}
                            title={`ส่งคืน: ${asset.returnedTo}`}
                          />
                        )}
                        <span className="font-bold font-mono text-slate-900 text-sm tracking-wide">
                          {asset.sapNo}
                        </span>
                      </div>
                      {asset.costCenterName && (
                        <div className="text-[10px] text-slate-400 truncate max-w-[150px]">
                          {asset.costCenterName}
                        </div>
                      )}
                    </td>

                    {/* Name & Serial No */}
                    <td className="py-3 px-3.5">
                      <div className="font-semibold text-slate-800 line-clamp-2 leading-snug">
                        {asset.name}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                        {asset.serialNo && asset.serialNo !== '-' && (
                          <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-[11px] text-slate-600">
                            S/N: {asset.serialNo}
                          </span>
                        )}
                        {asset.budgetYear && (
                          <span className="text-slate-400 text-[11px]">ปีงบ: {asset.budgetYear}</span>
                        )}
                      </div>

                      {/* Note display */}
                      {asset.note && (
                        <div className="text-xs text-rose-600 mt-1 flex items-start gap-1 bg-rose-50/60 p-1.5 rounded-md border border-rose-100">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-500" />
                          <span className="line-clamp-2">{asset.note}</span>
                        </div>
                      )}

                      {/* Inspector footer */}
                      {asset.updatedBy && asset.status !== 'pending' && (
                        <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400" />
                          <span>
                            ตรวจโดย: <strong className="text-slate-600">{asset.updatedBy}</strong>
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Location & Room */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-1 font-medium text-slate-800 text-xs">
                        <MapPin className="w-3 h-3 text-red-500 shrink-0" />
                        <span className="truncate max-w-[180px]">{asset.location || '-'}</span>
                      </div>
                      <div className="text-xs text-slate-500 ml-4 mt-0.5">
                        ห้อง: <strong className="text-slate-700">{asset.room || '-'}</strong>
                      </div>
                    </td>

                    {/* Inspection Team */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      {asset.team ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                          {asset.team}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">-</span>
                      )}
                    </td>

                    {/* Status selection and issue badges */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <div className="flex flex-col gap-1.5 items-start">
                        {/* Status dropdown */}
                        <select
                          id={`status-select-${asset.sapNo}`}
                          value={asset.status}
                          onChange={(e) =>
                            onQuickUpdateStatus(asset.id, e.target.value as AssetStatus)
                          }
                          className={`text-xs font-bold rounded-lg px-2.5 py-1.5 outline-none border shadow-2xs transition-all cursor-pointer ${getStatusBadgeStyle(
                            asset.status
                          )}`}
                        >
                          <option value="pending">⏳ ยังไม่ตรวจ</option>
                          <option value="found">✅ ใช้งานได้</option>
                          <option value="broken">⚠️ ชำรุด</option>
                          <option value="deteriorated">📦 เสื่อมสภาพ</option>
                          <option value="missing">❌ ตรวจไม่พบ</option>
                        </select>

                        {/* Issue flags & sticker badges */}
                        <div className="flex flex-wrap gap-1 max-w-[220px]">
                          {asset.invalidDepartment && (
                            <span
                              className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200"
                              title="หน่วยงานผู้ถือครองไม่ถูกต้อง"
                            >
                              หน่วยงานผิด
                            </span>
                          )}
                          {asset.invalidLocation && (
                            <span
                              className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200"
                              title="สถานที่ตั้งไม่ถูกต้อง"
                            >
                              สถานที่ผิด
                            </span>
                          )}
                          {asset.invalidModel && (
                            <span
                              className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200"
                              title="ไม่มียี่ห้อ/รุ่น หรือมีแต่ไม่ถูกต้อง"
                            >
                              ยี่ห้อ/รุ่นผิด
                            </span>
                          )}
                          {asset.requestSticker && (
                            <span
                              className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-pink-50 text-pink-700 border border-pink-200 flex items-center gap-0.5"
                              title="ขอรับป้ายสติ๊กเกอร์บาร์โค้ดใหม่"
                            >
                              <QrCode className="w-2.5 h-2.5" />
                              <span>ขอป้ายใหม่</span>
                            </span>
                          )}
                          {returnBadge}
                        </div>
                      </div>
                    </td>

                    {/* Manage / Inspect button */}
                    <td className="py-3 px-3.5 text-right whitespace-nowrap">
                      <button
                        id={`btn-inspect-${asset.sapNo}`}
                        onClick={() => onOpenInspectModal(asset)}
                        className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-lg text-xs font-semibold inline-flex items-center gap-1 active:scale-95 transition-all shadow-2xs"
                        title="อัปเดตผลการตรวจสอบและบันทึกรายละเอียด"
                      >
                        <FileEdit className="w-3.5 h-3.5 text-blue-600" />
                        <span>อัปเดตผล</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="bg-slate-50/80 px-4 py-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
        {/* Page size selector & Item count */}
        <div className="flex items-center gap-2">
          <span>แสดง</span>
          <select
            id="page-size-select"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="border border-slate-300 rounded px-2 py-1 bg-white outline-none font-medium focus:border-blue-500"
          >
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={200}>200</option>
          </select>
          <span>รายการต่อหน้า</span>
          <span className="text-slate-400">|</span>
          <span>
            แสดง <strong className="text-slate-800">{startItem.toLocaleString()} - {endItem.toLocaleString()}</strong> จาก{' '}
            <strong className="text-slate-800">{totalFilteredCount.toLocaleString()}</strong> รายการ
          </span>
        </div>

        {/* Page navigation */}
        <div className="flex items-center gap-1.5">
          <button
            id="btn-prev-page"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-semibold flex items-center gap-1 transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>ก่อนหน้า</span>
          </button>
          <span className="px-3 py-1.5 font-bold text-blue-900 bg-blue-50 border border-blue-200 rounded-lg">
            {currentPage} / {totalPages}
          </span>
          <button
            id="btn-next-page"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-semibold flex items-center gap-1 transition-colors"
          >
            <span>ถัดไป</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
