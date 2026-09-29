import React, { useState, useRef, useMemo } from 'react';
import {
  X,
  FileText,
  Download,
  Printer,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  XCircle,
  Clock,
  Settings2,
  FileSpreadsheet,
  Building2,
  Calendar,
  UserCheck,
  Check,
  Loader2,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { AssetItem, AssetStatus } from '../types';
import { exportElementToPdf, parseAssetValue, formatBaht } from '../services/pdfGenerator';

interface PdfExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  allAssets: AssetItem[];
  filteredAssets: AssetItem[];
  inspectorName?: string;
}

interface StatusGroupConfig {
  id: AssetStatus;
  title: string;
  badgeLabel: string;
  badgeColor: string;
  borderColor: string;
  bgColor: string;
  headerBg: string;
  textColor: string;
  icon: React.ReactNode;
  recommendation: string;
}

const STATUS_GROUPS: StatusGroupConfig[] = [
  {
    id: 'found',
    title: 'พัสดุใช้งานได้ปกติ (พบตัวพัสดุ)',
    badgeLabel: 'ใช้งานได้ปกติ',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    borderColor: 'border-emerald-300',
    bgColor: 'bg-emerald-50/40',
    headerBg: 'bg-emerald-700 text-white',
    textColor: 'text-emerald-800',
    icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
    recommendation: 'ใช้งานตามปกติ / ปิดป้ายตรวจสอบพัสดุประจำปี',
  },
  {
    id: 'broken',
    title: 'พัสดุชำรุด (ต้องดำเนินการซ่อมแซม)',
    badgeLabel: 'ชำรุด',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
    borderColor: 'border-amber-300',
    bgColor: 'bg-amber-50/40',
    headerBg: 'bg-amber-600 text-white',
    textColor: 'text-amber-800',
    icon: <AlertTriangle className="w-4 h-4 text-amber-600" />,
    recommendation: 'ส่งตรวจสอบทางเทคนิค / ดำเนินการซ่อมแซมปรับปรุงสภาพ',
  },
  {
    id: 'deteriorated',
    title: 'พัสดุเสื่อมสภาพ (เสนอเพื่อจำหน่าย/ปลดระวาง)',
    badgeLabel: 'เสื่อมสภาพ',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
    borderColor: 'border-purple-300',
    bgColor: 'bg-purple-50/40',
    headerBg: 'bg-purple-700 text-white',
    textColor: 'text-purple-800',
    icon: <HelpCircle className="w-4 h-4 text-purple-600" />,
    recommendation: 'แต่งตั้งคณะกรรมการประเมินสภาพเพื่อเสนอจำหน่าย/ตัดบัญชี',
  },
  {
    id: 'missing',
    title: 'พัสดุตรวจไม่พบ (สูญหายหรือไม่อยู่ในสถานที่ตั้ง)',
    badgeLabel: 'ตรวจไม่พบ',
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
    borderColor: 'border-rose-300',
    bgColor: 'bg-rose-50/40',
    headerBg: 'bg-rose-700 text-white',
    textColor: 'text-rose-800',
    icon: <XCircle className="w-4 h-4 text-rose-600" />,
    recommendation: 'ประสานงานผู้ถือครอง / ตั้งกรรมการสอบข้อเท็จจริงการสูญหาย',
  },
  {
    id: 'pending',
    title: 'พัสดุที่ยังไม่ได้ตรวจสอบ (รอนับตามแผน)',
    badgeLabel: 'ยังไม่ตรวจ',
    badgeColor: 'bg-slate-100 text-slate-700 border-slate-300',
    borderColor: 'border-slate-300',
    bgColor: 'bg-slate-50/40',
    headerBg: 'bg-slate-700 text-white',
    textColor: 'text-slate-700',
    icon: <Clock className="w-4 h-4 text-slate-500" />,
    recommendation: 'กำหนดวันเข้าตรวจนับเพิ่มเติมตามแผนการตรวจสอบ',
  },
];

export const PdfExportModal: React.FC<PdfExportModalProps> = ({
  isOpen,
  onClose,
  allAssets,
  filteredAssets,
  inspectorName = 'ผู้ตรวจสอบพัสดุ',
}) => {
  if (!isOpen) return null;

  // Options State
  const [dataScope, setDataScope] = useState<'all' | 'filtered'>('all');
  const [reportFormat, setReportFormat] = useState<'full' | 'summary'>('full');
  const [selectedStatuses, setSelectedStatuses] = useState<Record<AssetStatus, boolean>>({
    found: true,
    broken: true,
    deteriorated: true,
    missing: true,
    pending: true,
  });

  // Organization & Committee details
  const [showConfigDetails, setShowConfigDetails] = useState<boolean>(false);
  const [orgName, setOrgName] = useState<string>('มหาวิทยาลัยมหิดล');
  const [subOrgName, setSubOrgName] = useState<string>('คณะ / กอง / ส่วนงาน');
  const [reportTitle, setReportTitle] = useState<string>(
    'รายงานสรุปผลการตรวจสอบพัสดุครุภัณฑ์ประจำปี'
  );
  const [committeeChair, setCommitteeChair] = useState<string>('......................................................');
  const [committeeMember1, setCommitteeMember1] = useState<string>(inspectorName || '......................................................');
  const [committeeMember2, setCommitteeMember2] = useState<string>('......................................................');
  const [includeSignatures, setIncludeSignatures] = useState<boolean>(true);

  // Export progress
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgressText, setExportProgressText] = useState<string>('');

  const reportRef = useRef<HTMLDivElement>(null);

  // Active items based on scope
  const targetAssets = useMemo(() => {
    return dataScope === 'all' ? allAssets : filteredAssets;
  }, [dataScope, allAssets, filteredAssets]);

  // Group assets by status
  const groupedData = useMemo(() => {
    const map: Record<AssetStatus, AssetItem[]> = {
      found: [],
      broken: [],
      deteriorated: [],
      missing: [],
      pending: [],
    };

    targetAssets.forEach((a) => {
      if (map[a.status]) {
        map[a.status].push(a);
      } else {
        map.pending.push(a);
      }
    });

    return map;
  }, [targetAssets]);

  // Overall Statistics
  const overallStats = useMemo(() => {
    const total = targetAssets.length;
    let totalValue = 0;
    let foundValue = 0;
    let brokenValue = 0;
    let deterioratedValue = 0;
    let missingValue = 0;
    let pendingValue = 0;

    let stickerCount = 0;
    let invalidRegistryCount = 0;
    let returnedSupplyCount = 0;
    let returnedItCount = 0;

    targetAssets.forEach((a) => {
      const val = parseAssetValue(a.value);
      totalValue += val;

      if (a.status === 'found') foundValue += val;
      else if (a.status === 'broken') brokenValue += val;
      else if (a.status === 'deteriorated') deterioratedValue += val;
      else if (a.status === 'missing') missingValue += val;
      else pendingValue += val;

      if (a.requestSticker) stickerCount++;
      if (a.invalidDepartment || a.invalidLocation || a.invalidModel) invalidRegistryCount++;
      if (a.returnedTo?.toLowerCase().includes('พัสดุ') || a.returnedTo?.toLowerCase().includes('supply')) {
        returnedSupplyCount++;
      }
      if (a.returnedTo?.toLowerCase().includes('สารสนเทศ') || a.returnedTo?.toLowerCase().includes('it')) {
        returnedItCount++;
      }
    });

    const inspectedCount = total - groupedData.pending.length;
    const inspectedPercent = total > 0 ? ((inspectedCount / total) * 100).toFixed(1) : '0';

    return {
      total,
      totalValue,
      inspectedCount,
      inspectedPercent,
      foundValue,
      brokenValue,
      deterioratedValue,
      missingValue,
      pendingValue,
      stickerCount,
      invalidRegistryCount,
      returnedSupplyCount,
      returnedItCount,
    };
  }, [targetAssets, groupedData]);

  // Toggle single status checkbox
  const toggleStatus = (st: AssetStatus) => {
    setSelectedStatuses((prev) => ({
      ...prev,
      [st]: !prev[st],
    }));
  };

  // Toggle select all statuses
  const toggleAllStatuses = (select: boolean) => {
    setSelectedStatuses({
      found: select,
      broken: select,
      deteriorated: select,
      missing: select,
      pending: select,
    });
  };

  // Trigger PDF Generation and Download
  const handleDownloadPdf = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);
    setExportProgressText('เริ่มต้นจัดทำเอกสาร PDF...');

    try {
      const dateStr = new Date().toISOString().slice(0, 10);
      const filename = `รายงานสรุปผลการตรวจสอบพัสดุ_${dateStr}.pdf`;
      await exportElementToPdf(reportRef.current, {
        filename,
        onProgress: (status) => setExportProgressText(status),
      });
    } catch (err) {
      console.error('PDF export error:', err);
      alert('เกิดข้อผิดพลาดในการสร้างไฟล์ PDF โปรดลองใช้ฟังก์ชัน "พิมพ์เอกสาร / บันทึกเป็น PDF"');
    } finally {
      setIsExporting(false);
      setExportProgressText('');
    }
  };

  // Trigger Native Print Dialog
  const handlePrint = () => {
    window.print();
  };

  const currentDateThai = useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, []);

  return (
    <div
      id="pdf-export-modal"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl flex flex-col max-h-[95vh] overflow-hidden">
        {/* Modal Top Bar */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-rose-950 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-rose-600/30 border border-rose-500/40 flex items-center justify-center text-rose-300">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-heading flex items-center gap-2">
                <span>ส่งออกรายงาน PDF สรุปสถานะการตรวจพัสดุ</span>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-rose-600 text-white">
                  PDF Report
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                สรุปสถานะการตรวจสอบพัสดุครุภัณฑ์ จัดกลุ่มตามประเภทสถานะการใช้งาน พร้อมสถิติและบัญชีพัสดุ
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Configuration Controls Bar */}
        <div className="bg-slate-50 border-b border-slate-200 p-4 space-y-3 flex-shrink-0 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            {/* Scope Selection */}
            <div className="md:col-span-4">
              <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                <span>ขอบเขตข้อมูลที่นำมาออกรายงาน:</span>
              </label>
              <div className="grid grid-cols-2 gap-1.5 bg-slate-200/70 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setDataScope('all')}
                  className={`py-1.5 px-2 rounded-md font-semibold transition-all cursor-pointer text-center ${
                    dataScope === 'all'
                      ? 'bg-white text-blue-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ทั้งหมด ({allAssets.length})
                </button>
                <button
                  type="button"
                  onClick={() => setDataScope('filtered')}
                  className={`py-1.5 px-2 rounded-md font-semibold transition-all cursor-pointer text-center ${
                    dataScope === 'filtered'
                      ? 'bg-white text-blue-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ตามตัวกรอง ({filteredAssets.length})
                </button>
              </div>
            </div>

            {/* Report Format Selection */}
            <div className="md:col-span-4">
              <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>รูปแบบรายงาน:</span>
              </label>
              <div className="grid grid-cols-2 gap-1.5 bg-slate-200/70 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setReportFormat('full')}
                  className={`py-1.5 px-2 rounded-md font-semibold transition-all cursor-pointer text-center ${
                    reportFormat === 'full'
                      ? 'bg-white text-blue-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ฉบับเต็ม (สรุป + รายชื่อ)
                </button>
                <button
                  type="button"
                  onClick={() => setReportFormat('summary')}
                  className={`py-1.5 px-2 rounded-md font-semibold transition-all cursor-pointer text-center ${
                    reportFormat === 'summary'
                      ? 'bg-white text-blue-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  เฉพาะสรุปภาพรวม
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="md:col-span-4 flex items-end justify-end gap-2 pt-2 md:pt-0">
              <button
                type="button"
                id="btn-trigger-print"
                onClick={handlePrint}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold flex items-center gap-1.5 shadow-xs active:scale-95 transition-all cursor-pointer"
                title="เปิดหน้าต่างสั่งพิมพ์ของเบราว์เซอร์ (สามารถเลือก บันทึกเป็น PDF ได้)"
              >
                <Printer className="w-4 h-4" />
                <span>พิมพ์ / บันทึก PDF</span>
              </button>

              <button
                type="button"
                id="btn-download-pdf-file"
                onClick={handleDownloadPdf}
                disabled={isExporting}
                className="px-4 py-2 bg-gradient-to-r from-rose-700 to-red-600 hover:from-rose-600 hover:to-red-500 text-white rounded-lg font-semibold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                title="สร้างและดาวน์โหลดไฟล์ PDF โดยตรง"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>กำลังสร้าง PDF...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>ดาวน์โหลด PDF</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Group Filter Checkboxes (only shown if format is full) */}
          {reportFormat === 'full' && (
            <div className="pt-2 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-semibold text-slate-600 text-[11px] mr-1">กลุ่มสถานะที่ต้องการแสดง:</span>
                {STATUS_GROUPS.map((grp) => {
                  const isChecked = selectedStatuses[grp.id];
                  const count = groupedData[grp.id]?.length || 0;
                  return (
                    <label
                      key={grp.id}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium border cursor-pointer transition-all ${
                        isChecked
                          ? `${grp.badgeColor} font-semibold shadow-xs`
                          : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-100'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleStatus(grp.id)}
                        className="rounded text-blue-600 focus:ring-0 w-3 h-3 cursor-pointer"
                      />
                      <span>{grp.badgeLabel}</span>
                      <span className="text-[10px] opacity-75 font-mono">({count})</span>
                    </label>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={() => toggleAllStatuses(true)}
                  className="text-blue-700 hover:underline cursor-pointer"
                >
                  เลือกทั้งหมด
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={() => toggleAllStatuses(false)}
                  className="text-slate-500 hover:underline cursor-pointer"
                >
                  ยกเลิกทั้งหมด
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={() => setShowConfigDetails(!showConfigDetails)}
                  className="text-slate-600 hover:text-slate-900 flex items-center gap-0.5 cursor-pointer font-semibold"
                >
                  <Settings2 className="w-3.5 h-3.5" />
                  <span>แก้ไขหัวรายงาน/กรรมการ</span>
                  {showConfigDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              </div>
            </div>
          )}

          {/* Config Details Drawer */}
          {showConfigDetails && (
            <div className="p-3 bg-white rounded-lg border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-2.5 animate-fadeIn">
              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">หน่วยงานหลัก</label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">คณะ / กอง / ส่วนงาน</label>
                <input
                  type="text"
                  value={subOrgName}
                  onChange={(e) => setSubOrgName(e.target.value)}
                  className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">ชื่อหัวข้อรายงาน</label>
                <input
                  type="text"
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">ประธานกรรมการตรวจสอบ</label>
                <input
                  type="text"
                  value={committeeChair}
                  onChange={(e) => setCommitteeChair(e.target.value)}
                  className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">กรรมการตรวจสอบ (1)</label>
                <input
                  type="text"
                  value={committeeMember1}
                  onChange={(e) => setCommitteeMember1(e.target.value)}
                  className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">กรรมการและเลขานุการ (2)</label>
                <input
                  type="text"
                  value={committeeMember2}
                  onChange={(e) => setCommitteeMember2(e.target.value)}
                  className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
                />
              </div>
            </div>
          )}

          {/* Progress notification banner */}
          {isExporting && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 px-3 py-2 rounded-lg flex items-center gap-2 text-xs">
              <Loader2 className="w-4 h-4 animate-spin text-rose-600 flex-shrink-0" />
              <span>{exportProgressText || 'กำลังประมวลผลไฟล์ PDF...'}</span>
            </div>
          )}
        </div>

        {/* Document Preview Viewport */}
        <div className="flex-1 overflow-y-auto bg-slate-200/70 p-3 sm:p-6 flex justify-center">
          {/* Printable Container */}
          <div
            id="pdf-printable-report"
            ref={reportRef}
            className="w-full max-w-[800px] bg-white text-slate-900 shadow-md p-6 sm:p-8 space-y-6 text-sm font-sans"
            style={{ minHeight: '1123px' }}
          >
            {/* Official Report Header */}
            <div className="border-b-2 border-slate-800 pb-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {orgName} • {subOrgName}
                  </div>
                  <h1 className="text-xl font-bold font-heading text-slate-900 mt-1">
                    {reportTitle}
                  </h1>
                  <p className="text-xs text-slate-600 mt-0.5">
                    จำแนกและสรุปผลตามประเภทสถานะการใช้งานพัสดุ (Asset Usage Condition Summary)
                  </p>
                </div>
                <div className="text-right text-[11px] text-slate-500 leading-tight">
                  <div className="font-semibold text-slate-800">เอกสารรายงานประจำปี</div>
                  <div>วันที่พิมพ์: {currentDateThai}</div>
                  <div>ผู้พิมพ์: {inspectorName}</div>
                </div>
              </div>

              {/* Document metadata chips */}
              <div className="flex flex-wrap items-center gap-3 mt-3 pt-2 border-t border-slate-100 text-xs text-slate-600">
                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>ปีงบประมาณ: ปัจจุบัน</span>
                </span>
                <span className="inline-flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    ขอบเขต: {dataScope === 'all' ? 'พัสดุทั้งหมดในระบบ' : 'รายการตามตัวกรองที่เลือก'}
                  </span>
                </span>
                <span className="inline-flex items-center gap-1">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-slate-400" />
                  <span>จำนวนรวม: <strong>{overallStats.total}</strong> รายการ</span>
                </span>
                <span className="inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>
                    ตรวจสอบแล้ว: <strong>{overallStats.inspectedCount}</strong> รายการ ({overallStats.inspectedPercent}%)
                  </span>
                </span>
              </div>
            </div>

            {/* PART 1: Executive Summary Cards */}
            <div>
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-700 inline-block"></span>
                <span>ส่วนที่ 1: สรุปภาพรวมสถานะการตรวจพัสดุทั้งหมด</span>
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-3">
                {STATUS_GROUPS.map((grp) => {
                  const items = groupedData[grp.id] || [];
                  const count = items.length;
                  const pct = overallStats.total > 0 ? ((count / overallStats.total) * 100).toFixed(1) : '0';
                  let sumVal = 0;
                  items.forEach((a) => (sumVal += parseAssetValue(a.value)));

                  return (
                    <div
                      key={grp.id}
                      className={`p-2.5 rounded-lg border ${grp.borderColor} ${grp.bgColor} flex flex-col justify-between`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-bold text-slate-700">{grp.badgeLabel}</span>
                        {grp.icon}
                      </div>
                      <div className="mt-1">
                        <div className="text-lg font-bold text-slate-900 leading-tight">
                          {count} <span className="text-[10px] font-normal text-slate-500">ชิ้น</span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium">
                          คิดเป็น {pct}%
                        </div>
                        {sumVal > 0 && (
                          <div className="text-[10px] text-slate-600 mt-1 font-mono truncate">
                            ฿{formatBaht(sumVal)}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Status Comparison Table */}
              <div className="border border-slate-200 rounded-lg overflow-hidden mb-3">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-800 text-white text-[11px]">
                      <th className="py-2 px-3 font-semibold">ประเภทสถานะการใช้งาน</th>
                      <th className="py-2 px-3 font-semibold text-center w-20">จำนวน (ชิ้น)</th>
                      <th className="py-2 px-3 font-semibold text-center w-20">สัดส่วน (%)</th>
                      <th className="py-2 px-3 font-semibold text-right w-28">มูลค่ารวม (บาท)</th>
                      <th className="py-2 px-3 font-semibold">แนวทางดำเนินการ / ข้อเสนอแนะ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {STATUS_GROUPS.map((grp) => {
                      const items = groupedData[grp.id] || [];
                      const count = items.length;
                      const pct = overallStats.total > 0 ? ((count / overallStats.total) * 100).toFixed(1) : '0';
                      let sumVal = 0;
                      items.forEach((a) => (sumVal += parseAssetValue(a.value)));

                      return (
                        <tr key={grp.id} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-medium flex items-center gap-2">
                            {grp.icon}
                            <span>{grp.title}</span>
                          </td>
                          <td className="py-2 px-3 text-center font-bold font-mono">
                            {count}
                          </td>
                          <td className="py-2 px-3 text-center font-mono text-slate-600">
                            {pct}%
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-slate-700">
                            {sumVal > 0 ? formatBaht(sumVal) : '-'}
                          </td>
                          <td className="py-2 px-3 text-[11px] text-slate-600">
                            {grp.recommendation}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 font-bold text-slate-800 text-xs border-t-2 border-slate-300">
                      <td className="py-2 px-3">รวมทั้งสิ้น</td>
                      <td className="py-2 px-3 text-center font-mono">{overallStats.total}</td>
                      <td className="py-2 px-3 text-center font-mono">100.0%</td>
                      <td className="py-2 px-3 text-right font-mono">
                        {overallStats.totalValue > 0 ? formatBaht(overallStats.totalValue) : '-'}
                      </td>
                      <td className="py-2 px-3 text-[11px] text-slate-600">
                        ตรวจสอบเสร็จสิ้นแล้ว {overallStats.inspectedPercent}%
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Additional Issues Summary Banner */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                  <span className="text-slate-600">ขอรับป้ายสติ๊กเกอร์:</span>
                  <strong className="text-slate-900 font-mono">{overallStats.stickerCount} รายการ</strong>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                  <span className="text-slate-600">ทะเบียนไม่ถูกต้อง:</span>
                  <strong className="text-slate-900 font-mono">{overallStats.invalidRegistryCount} รายการ</strong>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                  <span className="text-slate-600">ส่งคืนพัสดุ:</span>
                  <strong className="text-slate-900 font-mono">{overallStats.returnedSupplyCount} รายการ</strong>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-sky-500"></div>
                  <span className="text-slate-600">ส่งคืนฝ่ายสารสนเทศ:</span>
                  <strong className="text-slate-900 font-mono">{overallStats.returnedItCount} รายการ</strong>
                </div>
              </div>
            </div>

            {/* PART 2: Detailed Grouped Inventory Lists (if full report) */}
            {reportFormat === 'full' && (
              <div className="space-y-6 pt-2">
                <div className="border-t-2 border-slate-300 pt-3">
                  <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-700 inline-block"></span>
                    <span>ส่วนที่ 2: บัญชีรายละเอียดพัสดุจัดกลุ่มตามประเภทสถานะการใช้งาน</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    แสดงรายละเอียดของครุภัณฑ์แต่ละรายการแยกตามกลุ่มสถานะ เพื่อใช้ประกอบการตรวจสอบและดำเนินการ
                  </p>
                </div>

                {STATUS_GROUPS.filter((grp) => selectedStatuses[grp.id]).map((grp) => {
                  const items = groupedData[grp.id] || [];
                  let groupTotalValue = 0;
                  items.forEach((a) => (groupTotalValue += parseAssetValue(a.value)));

                  return (
                    <div
                      key={grp.id}
                      className="border border-slate-300 rounded-lg overflow-hidden page-break-inside-avoid"
                    >
                      {/* Status Group Header Banner */}
                      <div className={`px-4 py-2.5 ${grp.headerBg} flex items-center justify-between`}>
                        <div className="flex items-center gap-2">
                          <span className="p-1 bg-white/20 rounded-md text-white">{grp.icon}</span>
                          <div>
                            <h3 className="text-xs sm:text-sm font-bold tracking-wide">
                              {grp.title}
                            </h3>
                            <div className="text-[10px] opacity-90">
                              {grp.recommendation}
                            </div>
                          </div>
                        </div>
                        <div className="text-right text-xs">
                          <span className="font-bold">{items.length}</span> รายการ
                          {groupTotalValue > 0 && (
                            <span className="ml-2 opacity-90 font-mono">
                              (฿{formatBaht(groupTotalValue)})
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Itemized Table */}
                      {items.length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-400 italic bg-white">
                          -- ไม่พบรายการพัสดุในสถานะนี้ --
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="bg-slate-100 text-slate-700 text-[10px] border-b border-slate-200">
                                <th className="py-1.5 px-2 text-center w-10">ลำดับ</th>
                                <th className="py-1.5 px-2 font-semibold w-28">รหัส SAP</th>
                                <th className="py-1.5 px-2 font-semibold">รายละเอียดพัสดุ</th>
                                <th className="py-1.5 px-2 font-semibold w-24">Serial No.</th>
                                <th className="py-1.5 px-2 font-semibold w-32">สถานที่ตั้ง / ห้อง</th>
                                <th className="py-1.5 px-2 font-semibold text-right w-20">มูลค่า (บาท)</th>
                                <th className="py-1.5 px-2 font-semibold w-36">หมายเหตุ / ปัญหาที่พบ</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                              {items.map((asset, idx) => {
                                const issueBadges: string[] = [];
                                if (asset.requestSticker) issueBadges.push('ขอป้ายใหม่');
                                if (asset.invalidDepartment) issueBadges.push('หน่วยงานผิด');
                                if (asset.invalidLocation) issueBadges.push('สถานที่ผิด');
                                if (asset.invalidModel) issueBadges.push('รุ่น/ยี่ห้อผิด');
                                if (asset.returnedTo) issueBadges.push(`คืน:${asset.returnedTo}`);

                                return (
                                  <tr key={asset.id || asset.sapNo} className="hover:bg-slate-50/70">
                                    <td className="py-1.5 px-2 text-center text-slate-400 font-mono text-[10px]">
                                      {idx + 1}
                                    </td>
                                    <td className="py-1.5 px-2 font-mono font-semibold text-slate-800 text-[11px]">
                                      {asset.sapNo}
                                    </td>
                                    <td className="py-1.5 px-2 text-slate-800">
                                      <div className="font-medium">{asset.name}</div>
                                      {asset.vendor && (
                                        <div className="text-[10px] text-slate-400">
                                          ผู้ขาย: {asset.vendor}
                                        </div>
                                      )}
                                    </td>
                                    <td className="py-1.5 px-2 font-mono text-[11px] text-slate-600">
                                      {asset.serialNo || '-'}
                                    </td>
                                    <td className="py-1.5 px-2 text-[11px] text-slate-600">
                                      <div>{asset.location || '-'}</div>
                                      {asset.room && (
                                        <div className="text-[10px] text-slate-400">ห้อง: {asset.room}</div>
                                      )}
                                    </td>
                                    <td className="py-1.5 px-2 text-right font-mono text-[11px] text-slate-700">
                                      {asset.value ? formatBaht(parseAssetValue(asset.value)) : '-'}
                                    </td>
                                    <td className="py-1.5 px-2 text-[10px]">
                                      {asset.note && (
                                        <div className="text-slate-700 mb-0.5">{asset.note}</div>
                                      )}
                                      {issueBadges.length > 0 && (
                                        <div className="flex flex-wrap gap-1">
                                          {issueBadges.map((b, bi) => (
                                            <span
                                              key={bi}
                                              className="px-1 py-0.2 rounded bg-rose-100 text-rose-700 text-[9px] font-medium"
                                            >
                                              {b}
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                      {asset.updatedBy && (
                                        <div className="text-[9px] text-slate-400 mt-0.5">
                                          ตรวจโดย: {asset.updatedBy}
                                        </div>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* PART 3: Committee Signatures */}
            {includeSignatures && (
              <div className="pt-6 border-t-2 border-slate-300 page-break-inside-avoid">
                <div className="text-center mb-6">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    คณะกรรมการตรวจสอบพัสดุประจำปี
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    ขอรับรองว่ารายงานผลการตรวจสอบพัสดุและสถานะการใช้งานข้างต้นถูกต้องตรงตามสภาพจริงทุกประการ
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center text-xs">
                  {/* Chair */}
                  <div className="space-y-2">
                    <div className="h-10 flex items-end justify-center">
                      <span className="text-slate-400">...................................................</span>
                    </div>
                    <div className="font-semibold text-slate-800">({committeeChair})</div>
                    <div className="text-[11px] text-slate-500">ประธานกรรมการตรวจสอบพัสดุ</div>
                    <div className="text-[10px] text-slate-400">
                      วันที่ ...... / ................... / .........
                    </div>
                  </div>

                  {/* Member 1 */}
                  <div className="space-y-2">
                    <div className="h-10 flex items-end justify-center">
                      <span className="text-slate-400">...................................................</span>
                    </div>
                    <div className="font-semibold text-slate-800">({committeeMember1})</div>
                    <div className="text-[11px] text-slate-500">กรรมการตรวจสอบพัสดุ</div>
                    <div className="text-[10px] text-slate-400">
                      วันที่ ...... / ................... / .........
                    </div>
                  </div>

                  {/* Member 2 / Secretary */}
                  <div className="space-y-2">
                    <div className="h-10 flex items-end justify-center">
                      <span className="text-slate-400">...................................................</span>
                    </div>
                    <div className="font-semibold text-slate-800">({committeeMember2})</div>
                    <div className="text-[11px] text-slate-500">กรรมการและเลขานุการ</div>
                    <div className="text-[10px] text-slate-400">
                      วันที่ ...... / ................... / .........
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Document Footer Note */}
            <div className="text-center text-[10px] text-slate-400 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span>ระบบตรวจสอบพัสดุประจำปี • จัดทำเมื่อ {currentDateThai}</span>
              <span>หน้า 1 / 1 (ระบบพิมพ์อัตโนมัติ)</span>
            </div>
          </div>
        </div>

        {/* Modal Bottom Footer */}
        <div className="px-5 py-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs flex-shrink-0">
          <div className="text-slate-500">
            พัสดุในรายงาน: <strong>{targetAssets.length}</strong> รายการ | รูปแบบ: {reportFormat === 'full' ? 'ฉบับเต็ม' : 'เฉพาะสรุป'}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold cursor-pointer transition-colors"
            >
              ปิด
            </button>
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isExporting}
              className="px-4 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors disabled:opacity-50"
            >
              {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              <span>บันทึกเป็นไฟล์ PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
