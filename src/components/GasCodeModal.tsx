import React, { useState } from 'react';
import { X, Copy, Check, FileCode, HelpCircle } from 'lucide-react';
import codeGsContent from '../../scripts/Code.gs?raw';
import htmlContent from '../../scripts/Index.html?raw';

interface GasCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GasCodeModal: React.FC<GasCodeModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'code' | 'html'>('code');
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentContent = activeTab === 'code' ? codeGsContent : htmlContent;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-5">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full flex flex-col max-h-[92vh] overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <FileCode className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="font-bold text-base font-heading">โค้ด Google Apps Script (Code.gs & Index.html)</h3>
              <p className="text-xs text-slate-400">คัดลอกนำไปวางใน Extensions &gt; Apps Script ของ Google Sheets</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab & Action Toolbar */}
        <div className="flex items-center justify-between px-5 py-2.5 bg-slate-100 border-b border-slate-200">
          <div className="flex gap-1.5">
            <button
              onClick={() => setActiveTab('code')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'code' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              📄 Code.gs
            </button>
            <button
              onClick={() => setActiveTab('html')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'html' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              🌐 Index.html
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs active:scale-95 transition-all cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'คัดลอกเรียบร้อยแล้ว!' : 'คัดลอกโค้ดนี้'}</span>
          </button>
        </div>

        {/* Instructions banner */}
        <div className="bg-amber-50 border-b border-amber-200 px-5 py-2 text-[11px] text-amber-900 flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span>
            <strong>วิธีติดตั้ง:</strong> ไปที่ Google Sheet &gt; เมนูส่วนขยาย (Extensions) &gt; Apps Script &gt; วางโค้ด &gt; Deploy เป็น Web app (สิทธิ์: Everyone)
          </span>
        </div>

        {/* Code View Area */}
        <div className="p-4 overflow-y-auto flex-1 bg-slate-950 font-mono text-xs text-slate-200">
          <pre className="whitespace-pre-wrap leading-relaxed select-all">
            {currentContent}
          </pre>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
