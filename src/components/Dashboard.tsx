import React from 'react';
import {
  Boxes,
  CheckCircle2,
  AlertTriangle,
  PackageOpen,
  XCircle,
  FileWarning,
  QrCode,
  Clock,
} from 'lucide-react';
import { DashboardStats } from '../types';

interface DashboardProps {
  stats: DashboardStats;
  currentStatusFilter: string;
  onFilterChange: (status: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  stats,
  currentStatusFilter,
  onFilterChange,
}) => {
  const inspectedCount = stats.found + stats.broken + stats.deteriorated + stats.missing;
  const progressPercent = stats.total > 0 ? Math.round((inspectedCount / stats.total) * 100) : 0;

  const cards = [
    {
      id: 'all',
      title: 'ทั้งหมด',
      value: stats.total,
      icon: Boxes,
      color: 'border-blue-500 text-blue-600 bg-blue-50/50',
      activeBorder: 'ring-2 ring-blue-500',
    },
    {
      id: 'pending',
      title: 'ยังไม่ตรวจ',
      value: stats.pending,
      icon: Clock,
      color: 'border-slate-400 text-slate-600 bg-slate-50',
      activeBorder: 'ring-2 ring-slate-500',
    },
    {
      id: 'found',
      title: 'พบ/ใช้งานได้',
      value: stats.found,
      icon: CheckCircle2,
      color: 'border-emerald-500 text-emerald-600 bg-emerald-50/40',
      activeBorder: 'ring-2 ring-emerald-500',
    },
    {
      id: 'broken',
      title: 'ชำรุด',
      value: stats.broken,
      icon: AlertTriangle,
      color: 'border-amber-500 text-amber-600 bg-amber-50/40',
      activeBorder: 'ring-2 ring-amber-500',
    },
    {
      id: 'deteriorated',
      title: 'เสื่อมสภาพ',
      value: stats.deteriorated,
      icon: PackageOpen,
      color: 'border-orange-500 text-orange-600 bg-orange-50/40',
      activeBorder: 'ring-2 ring-orange-500',
    },
    {
      id: 'missing',
      title: 'ตรวจไม่พบ',
      value: stats.missing,
      icon: XCircle,
      color: 'border-rose-500 text-rose-600 bg-rose-50/40',
      activeBorder: 'ring-2 ring-rose-500',
    },
    {
      id: 'invalid-registry',
      title: 'ทะเบียนไม่ถูกต้อง',
      value: stats.invalidRegistry,
      icon: FileWarning,
      color: 'border-indigo-500 text-indigo-600 bg-indigo-50/40',
      activeBorder: 'ring-2 ring-indigo-500',
    },
    {
      id: 'sticker',
      title: 'ขอป้ายใหม่',
      value: stats.requestSticker,
      icon: QrCode,
      color: 'border-pink-500 text-pink-600 bg-pink-50/40',
      activeBorder: 'ring-2 ring-pink-500',
    },
  ];

  return (
    <section className="space-y-3 mb-4 sm:mb-6">
      {/* Progress Bar Header */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
            {progressPercent}%
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <span>ความคืบหน้าการตรวจสอบพัสดุ</span>
              <span className="text-slate-400 font-normal">
                ({inspectedCount.toLocaleString()} / {stats.total.toLocaleString()} รายการ)
              </span>
            </div>
            <div className="text-[11px] text-slate-500">
              ยังคงเหลือพัสดุที่ยังไม่ได้ตรวจ: <strong className="text-slate-700">{stats.pending.toLocaleString()} รายการ</strong>
            </div>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="w-full sm:w-64 bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200">
          <div
            className="bg-gradient-to-r from-blue-600 to-emerald-500 h-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Grid of stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 sm:gap-2.5">
        {cards.map((card) => {
          const Icon = card.icon;
          const isSelected = currentStatusFilter === card.id;

          return (
            <button
              key={card.id}
              id={`stat-card-${card.id}`}
              onClick={() => onFilterChange(card.id)}
              className={`p-3 rounded-xl bg-white border-l-4 shadow-xs text-left transition-all hover:shadow-sm active:scale-98 cursor-pointer ${
                card.color
              } ${isSelected ? `${card.activeBorder} shadow-sm scale-102` : 'border-slate-200 hover:border-slate-300'}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-medium text-slate-600 truncate">{card.title}</span>
                <Icon className="w-3.5 h-3.5 opacity-80" />
              </div>
              <div className="text-lg sm:text-xl font-bold font-heading tracking-tight leading-tight">
                {card.value.toLocaleString()}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
