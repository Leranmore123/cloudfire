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
  iconColor = 'text-sky-400',
  iconBg = 'bg-sky-500/10 border-sky-500/20',
}: StatCardProps) {
  return (
    <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-6 relative overflow-hidden group hover:border-slate-700 transition-all duration-300">
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {title}
          </span>
          <div className="text-3xl font-bold text-white mt-2 tracking-tight">{value}</div>
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
          {trend && <span className="text-xs text-emerald-400 font-medium mt-2 inline-block">{trend}</span>}
        </div>
        <div className={`p-3.5 rounded-xl border ${iconBg} ${iconColor}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
