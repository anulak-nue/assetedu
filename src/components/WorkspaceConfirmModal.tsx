import React from 'react';
import { AlertTriangle, CheckCircle, X, ShieldAlert } from 'lucide-react';

interface WorkspaceConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  details?: {
    actionType: string;
    targetName: string;
    itemCount?: number;
    destination?: string;
  };
  confirmLabel?: string;
  confirmVariant?: 'danger' | 'warning' | 'primary';
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const WorkspaceConfirmModal: React.FC<WorkspaceConfirmModalProps> = ({
  isOpen,
  title,
  description,
  details,
  confirmLabel = 'ยืนยันการดำเนินการ',
  confirmVariant = 'warning',
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
        <div className="p-5">
          <div className="flex items-start gap-3.5">
            <div
              className={`p-3 rounded-xl flex-shrink-0 ${
                confirmVariant === 'danger'
                  ? 'bg-rose-100 text-rose-600'
                  : confirmVariant === 'warning'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-blue-100 text-blue-700'
              }`}
            >
              {confirmVariant === 'danger' ? (
                <ShieldAlert className="w-6 h-6" />
              ) : confirmVariant === 'warning' ? (
                <AlertTriangle className="w-6 h-6" />
              ) : (
                <CheckCircle className="w-6 h-6" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h3 id="confirm-modal-title" className="font-bold text-base text-slate-900 font-heading">
                {title}
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {description}
              </p>
            </div>

            <button
              onClick={onCancel}
              disabled={isLoading}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {details && (
            <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-500">การดำเนินการ:</span>
                <span className="font-semibold text-slate-900">{details.actionType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">เป้าหมาย:</span>
                <span className="font-semibold text-slate-900 truncate max-w-[200px]" title={details.targetName}>
                  {details.targetName}
                </span>
              </div>
              {details.itemCount !== undefined && (
                <div className="flex justify-between">
                  <span className="text-slate-500">จำนวนรายการ:</span>
                  <span className="font-semibold text-blue-700">{details.itemCount.toLocaleString()} รายการ</span>
                </div>
              )}
              {details.destination && (
                <div className="flex justify-between">
                  <span className="text-slate-500">ปลายทาง:</span>
                  <span className="font-semibold text-slate-900">{details.destination}</span>
                </div>
              )}
            </div>
          )}

          <div className="mt-4 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-600" />
            <span>ระบบจะเข้าถึงและอัปเดตไฟล์ใน Google Workspace ตามสิทธิ์ที่ท่านอนุญาต</span>
          </div>
        </div>

        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 disabled:opacity-50"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2 ${
              confirmVariant === 'danger'
                ? 'bg-rose-600 hover:bg-rose-700'
                : confirmVariant === 'warning'
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isLoading ? (
              <span className="inline-block animate-spin mr-1">⌛</span>
            ) : null}
            <span>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
