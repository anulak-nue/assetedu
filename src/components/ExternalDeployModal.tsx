import React, { useState } from 'react';
import {
  X,
  Share2,
  ExternalLink,
  Copy,
  Check,
  Smartphone,
  Server,
  QrCode,
  Globe,
  Terminal,
  ShieldCheck,
  Sparkles,
  Download,
  FileSpreadsheet,
  FileText,
  Layers,
  Info,
} from 'lucide-react';

interface ExternalDeployModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPdfReport?: () => void;
  onExportCsv?: () => void;
  onToast: (msg: string, type?: 'success' | 'error') => void;
}

export const ExternalDeployModal: React.FC<ExternalDeployModalProps> = ({
  isOpen,
  onClose,
  onOpenPdfReport,
  onExportCsv,
  onToast,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'share' | 'mobile' | 'server' | 'export'>('share');
  const [copied, setCopied] = useState(false);

  // Shared production URL provided for this applet
  const sharedUrl =
    'https://ais-pre-bojzq6wemtnxohlszpplci-41601439691.asia-east1.run.app';

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(sharedUrl).then(
      () => {
        setCopied(true);
        onToast('คัดลอกลิงก์แอปพลิเคชันเรียบร้อยแล้ว', 'success');
        setTimeout(() => setCopied(false), 2500);
      },
      () => {
        onToast('ไม่สามารถคัดลอกได้ กรุณาไฮไลท์และคัดลอกด้วยตนเอง', 'error');
      }
    );
  };

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=8&data=${encodeURIComponent(
    sharedUrl
  )}`;

  return (
    <div
      id="external-deploy-modal"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-300">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-heading flex items-center gap-2">
                <span>นำระบบออกไปใช้งานภายนอก</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                  พร้อมใช้งาน
                </span>
              </h2>
              <p className="text-xs text-blue-200">
                แชร์ลิงก์ให้ทีมงาน, สแกน QR Code เปิดบนมือถือ, ติดตั้งเป็นแอป หรือนำ Source Code ไปติดตั้งบนเซิร์ฟเวอร์
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

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 text-xs font-semibold overflow-x-auto flex-shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('share')}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'share'
                ? 'border-blue-600 text-blue-700 bg-white shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Globe className="w-4 h-4 text-blue-600" />
            <span>1. ลิงก์ใช้งาน & QR Code สำหรับทีมงาน</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('mobile')}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'mobile'
                ? 'border-blue-600 text-blue-700 bg-white shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-4 h-4 text-purple-600" />
            <span>2. วิธีติดตั้งลงมือถือ/แท็บเล็ต (PWA)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('server')}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'server'
                ? 'border-blue-600 text-blue-700 bg-white shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Server className="w-4 h-4 text-emerald-600" />
            <span>3. ติดตั้งบน Server ของตนเอง (Self-Host)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('export')}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'export'
                ? 'border-blue-600 text-blue-700 bg-white shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Download className="w-4 h-4 text-rose-600" />
            <span>4. ส่งออกข้อมูล (CSV / PDF)</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5 text-sm">
          {/* TAB 1: Shared Link & QR Code */}
          {activeTab === 'share' && (
            <div className="space-y-5">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                <div className="p-2 bg-blue-600 text-white rounded-lg flex-shrink-0">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-blue-900 text-sm">
                    เปิดใช้งานภายนอกได้ทันทีผ่านลิงก์สาธารณะ (Shared Web App)
                  </h3>
                  <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                    ระบบนี้ถูก Deploy บน Cloud ของ Google เรียบร้อยแล้ว สามารถส่งต่อลิงก์หรือให้ทีมงานสแกน QR Code เพื่อเปิดใช้งานผ่านเว็บเบราว์เซอร์ได้ทันที ไม่จำกัดจำนวนผู้ใช้งาน และรองรับการบันทึกข้อมูลร่วมกันแบบ Real-time
                  </p>
                </div>
              </div>

              {/* URL Box and Copy Button */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5">
                <label className="block text-xs font-bold text-slate-700">
                  URL สาธารณะสำหรับเข้าใช้งานระบบ:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={sharedUrl}
                    className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm font-mono text-slate-800 focus:outline-none select-all"
                  />
                  <button
                    type="button"
                    onClick={handleCopyUrl}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer flex-shrink-0 active:scale-95 transition-all"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-300" />
                        <span>คัดลอกแล้ว</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>คัดลอกลิงก์</span>
                      </>
                    )}
                  </button>
                  <a
                    href={sharedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer flex-shrink-0 active:scale-95 transition-all"
                    title="เปิดในแท็บใหม่"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span className="hidden sm:inline">เปิดทันที</span>
                  </a>
                </div>
              </div>

              {/* QR Code Section */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center bg-slate-50/70 border border-slate-200 rounded-xl p-5">
                <div className="md:col-span-4 flex flex-col items-center justify-center p-3 bg-white border border-slate-200 rounded-xl shadow-xs">
                  <img
                    src={qrCodeUrl}
                    alt="QR Code สำหรับเปิดระบบตรวจพัสดุ"
                    className="w-48 h-48 object-contain rounded-lg"
                  />
                  <span className="text-[11px] font-semibold text-slate-500 mt-2 flex items-center gap-1">
                    <QrCode className="w-3.5 h-3.5 text-blue-600" />
                    <span>สแกนด้วยกล้องมือถือ</span>
                  </span>
                </div>
                <div className="md:col-span-8 space-y-3">
                  <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                    สแกน QR Code เพื่อเปิดใช้งานบนโทรศัพท์มือถือหรือแท็บเล็ต
                  </h4>
                  <ul className="text-xs text-slate-600 space-y-2 list-disc list-inside leading-relaxed">
                    <li>
                      <strong>ใช้กล้องมือถือสแกนได้ทันที</strong> ทั้ง iPhone (iOS) และ Android ไม่ต้องลงแอปพลิเคชันเพิ่มเติม
                    </li>
                    <li>
                      <strong>ใช้งานกล้องมือถือเพื่อสแกนบาร์โค้ด / QR Code</strong> บนตัวครุภัณฑ์ได้โดยตรงผ่านหน้าเว็บ
                    </li>
                    <li>
                      <strong>ทำงานร่วมกันได้พร้อมกันหลายคน</strong> โดยทีมตรวจพัสดุแต่ละทีมสามารถเลือกฟิลเตอร์เฉพาะทีมตนเอง และผลการตรวจจะอัปเดตขึ้นระบบทันที
                    </li>
                    <li>
                      <strong>พิมพ์ QR Code นี้ไปติด</strong> ณ ห้องตรวจพัสดุ หรือส่งเข้ากลุ่ม LINE ของทีมตรวจสอบได้สะดวก
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Mobile / PWA Installation */}
          {activeTab === 'mobile' && (
            <div className="space-y-4">
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-start gap-3">
                <div className="p-2 bg-purple-600 text-white rounded-lg flex-shrink-0">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-purple-900 text-sm">
                    ติดตั้งเป็นแอปพลิเคชันบนมือถือ (Progressive Web App - PWA)
                  </h3>
                  <p className="text-xs text-purple-700 mt-1 leading-relaxed">
                    ระบบได้ตั้งค่า Web App Manifest และ Offline Service Caching ไว้สมบูรณ์ สามารถติดตั้งลงบนหน้าจอโฮมของมือถือได้เสมือนแอปจริง (Native App) เปิดทำงานเต็มจอ รวดเร็ว และใช้งานได้แม้ไม่มีสัญญาณอินเทอร์เน็ต
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* iOS Instructions */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-slate-800 font-bold text-sm border-b border-slate-200 pb-2">
                    <span className="w-6 h-6 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs">
                      🍎
                    </span>
                    <span>สำหรับ iPhone / iPad (Safari)</span>
                  </div>
                  <ol className="text-xs text-slate-600 space-y-2 list-decimal list-inside leading-relaxed">
                    <li>
                      เปิดลิงก์แอปด้วยเว็บเบราว์เซอร์ <strong>Safari</strong>
                    </li>
                    <li>
                      กดปุ่ม <strong>แชร์ (Share Icon)</strong> รูปสี่เหลี่ยมที่มีลูกศรชี้ขึ้นที่แถบด้านล่าง
                    </li>
                    <li>
                      เลื่อนลงมาแล้วกดเลือก <strong>"เพิ่มไปยังหน้าจอโฮม" (Add to Home Screen)</strong>
                    </li>
                    <li>
                      กด <strong>"เพิ่ม" (Add)</strong> ที่มุมขวาบน
                    </li>
                    <li>
                      จะได้ไอคอน <strong>"ตรวจพัสดุ"</strong> บนหน้าจอมือถือ สามารถกดเข้าใช้งานเต็มหน้าจอได้ทันที
                    </li>
                  </ol>
                </div>

                {/* Android Instructions */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-slate-800 font-bold text-sm border-b border-slate-200 pb-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">
                      🤖
                    </span>
                    <span>สำหรับ Android (Google Chrome)</span>
                  </div>
                  <ol className="text-xs text-slate-600 space-y-2 list-decimal list-inside leading-relaxed">
                    <li>
                      เปิดลิงก์แอปด้วยเว็บเบราว์เซอร์ <strong>Google Chrome</strong>
                    </li>
                    <li>
                      กดปุ่มเมนู <strong>จุดสามจุด (⋮)</strong> ที่มุมบนขวา
                    </li>
                    <li>
                      กดเลือก <strong>"ติดตั้งแอป" (Install App)</strong> หรือ <strong>"เพิ่มลงในหน้าจอหลัก"</strong>
                    </li>
                    <li>
                      กดยืนยัน <strong>"ติดตั้ง"</strong>
                    </li>
                    <li>
                      ระบบจะสร้างแอปพลิเคชันบนมือถือ พร้อมเปิดทำงานด้วยความเร็วสูงและบันทึกข้อมูลออฟไลน์ได้
                    </li>
                  </ol>
                </div>
              </div>

              {/* Offline highlight */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-center gap-3 text-xs text-emerald-800">
                <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <div>
                  <strong>ความปลอดภัยและการทำงาน Offline:</strong>{' '}
                  หากเดินตรวจพัสดุในชั้นใต้ดินหรือห้องที่สัญญาณเน็ตหลุด ระบบจะจัดเก็บข้อมูลผลการตรวจไว้ในเครื่องอัตโนมัติ และจะทำการส่งขึ้น Cloud ทันทีที่เชื่อมต่อสัญญาณอินเทอร์เน็ตได้อีกครั้ง
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Self-Hosting & Server Build */}
          {activeTab === 'server' && (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
                <div className="p-2 bg-emerald-700 text-white rounded-lg flex-shrink-0">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-emerald-900 text-sm">
                    การนำ Source Code ไป Build และติดตั้งบนเซิร์ฟเวอร์ของตนเอง (Self-Hosting)
                  </h3>
                  <p className="text-xs text-emerald-700 mt-1 leading-relaxed">
                    คุณสามารถดาวน์โหลดหรือ Clone Source Code โปรเจกต์นี้ทั้งหมด เพื่อนำไป Build และ Host บน Nginx, Apache, Vercel, Firebase Hosting, Cloud Run หรือ Server ภายในองค์กรได้ทันที
                  </p>
                </div>
              </div>

              {/* Build Commands */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <Terminal className="w-4 h-4 text-slate-600" />
                    <span>คำสั่งสำหรับ Build โปรเจกต์:</span>
                  </span>
                </div>
                <div className="bg-slate-900 text-slate-100 rounded-xl p-3.5 font-mono text-xs space-y-1.5 overflow-x-auto">
                  <div className="text-slate-400"># 1. ติดตั้ง Dependencies ทั้งหมด</div>
                  <div className="text-emerald-400">npm install</div>
                  <div className="text-slate-400 mt-2"># 2. Build ไฟล์พร้อมใช้งาน Production</div>
                  <div className="text-emerald-400">npm run build</div>
                  <div className="text-slate-400 mt-2"># 3. ไฟล์เว็บสำเร็จรูปจะอยู่ที่โฟลเดอร์ dist/</div>
                  <div className="text-slate-300">ls -la dist/</div>
                </div>
              </div>

              {/* Web Servers options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/60 space-y-1.5">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                    <span>Firebase Hosting (แนะนำ)</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    เนื่องจากโปรเจกต์มี Firebase Config อยู่แล้ว สามารถพิมพ์คำสั่ง <code className="bg-slate-200 px-1 rounded font-mono">firebase deploy</code> เพื่อ Deploy ฟรีบน Google Cloud ได้ทันที
                  </p>
                </div>

                <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/60 space-y-1.5">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                    <span>Nginx / Apache / IIS ภายในองค์กร</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    นำไฟล์ทั้งหมดในโฟลเดอร์ <code className="bg-slate-200 px-1 rounded font-mono">dist/</code> ไปวางที่ Document Root ของ Web Server โดยตั้งค่า URL rewrite ไปที่ index.html
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Data Export */}
          {activeTab === 'export' && (
            <div className="space-y-4">
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3">
                <div className="p-2 bg-rose-600 text-white rounded-lg flex-shrink-0">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-rose-900 text-sm">
                    ส่งออกและสำรองข้อมูลเพื่อนำไปใช้งานกับโปรแกรมอื่น
                  </h3>
                  <p className="text-xs text-rose-700 mt-1 leading-relaxed">
                    หากต้องการนำข้อมูลผลการตรวจพัสดุไปเปิดใช้งานภายนอกบน Microsoft Excel, Google Sheets หรือนำเสนอต่อผู้บริหาร/คณะกรรมการ สามารถส่งออกได้ทันที
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* PDF Report Export Card */}
                <div className="border border-rose-200 bg-rose-50/30 rounded-xl p-4 flex flex-col justify-between space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
                      <FileText className="w-5 h-5 text-rose-600" />
                      <span>รายงานสรุปผลการตรวจพัสดุ (PDF)</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      สร้างเอกสารสรุปสถานะการตรวจพัสดุที่จัดกลุ่มตามประเภทสถานะการใช้งาน (ใช้งานได้, ชำรุด, เสื่อมสภาพ, ตรวจไม่พบ, ยังไม่ตรวจ) พร้อมตารางสรุป และช่องลงนามคณะกรรมการ
                    </p>
                  </div>
                  {onOpenPdfReport && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenPdfReport();
                      }}
                      className="w-full py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                    >
                      <FileText className="w-4 h-4" />
                      <span>เปิดระบบส่งออกรายงาน PDF</span>
                    </button>
                  )}
                </div>

                {/* CSV Spreadsheet Export Card */}
                <div className="border border-slate-200 bg-slate-50/60 rounded-xl p-4 flex flex-col justify-between space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                      <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                      <span>ไฟล์ตารางคำนวณ CSV (22 คอลัมน์)</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      ส่งออกรายการพัสดุทั้งหมดครบถ้วนตามแบบฟอร์ม 22 คอลัมน์มาตรฐาน สามารถเปิดใช้งานด้วย Microsoft Excel หรือนำเข้า Google Sheets ได้ทันที
                    </p>
                  </div>
                  {onExportCsv && (
                    <button
                      type="button"
                      onClick={() => {
                        onExportCsv();
                        onClose();
                      }}
                      className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>ดาวน์โหลดไฟล์ CSV ทันที</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs flex-shrink-0">
          <div className="text-slate-500 hidden sm:block">
            ลิงก์นี้เปิดให้ใช้งานได้แบบเรียลไทม์ 24 ชม.
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold cursor-pointer transition-colors"
            >
              ปิดหน้าต่าง
            </button>
            <button
              type="button"
              onClick={handleCopyUrl}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>คัดลอกลิงก์แอป</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
