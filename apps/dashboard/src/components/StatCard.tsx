import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: string;
  iconColor?: string;
  iconBg?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  iconColor = 'text-sky-600',
  iconBg = 'bg-sky-50 border-sky-200',
}: StatCardProps) {
  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 relative overflow-hidden group hover:border-slate-300 hover:shadow-md transition-all duration-300 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {title}
          </span>
          <div className="text-3xl font-extrabold text-slate-900 mt-2 tracking-tight">{value}</div>
          {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
          {trend && <span className="text-xs text-emerald-600 font-semibold mt-2 inline-block">{trend}</span>}
        </div>
        <div className={`p-3.5 rounded-xl border ${iconBg} ${iconColor}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
