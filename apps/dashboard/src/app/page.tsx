'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchApi } from '../lib/api-client';
import { copyToClipboard } from '../lib/clipboard';
import { StatCard } from '../components/StatCard';
import { QuickStartGuide } from '../components/QuickStartGuide';
import { Radio, Laptop, Activity, Database, Copy, Check, ExternalLink, ArrowRight, Terminal } from 'lucide-react';

export default function DashboardOverview() {
  const [stats, setStats] = useState<any>(null);
  const [tunnels, setTunnels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [overviewRes, tunnelsRes] = await Promise.all([
        fetchApi('/api/analytics/overview'),
        fetchApi('/api/tunnels')
      ]);

      if (overviewRes.success) {
        setStats(overviewRes.data);
      }
      if (tunnelsRes.success) {
        setTunnels(tunnelsRes.data || []);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  const handleCopy = async (text: string, id: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-sky-500/10 via-indigo-500/5 to-white border border-sky-200/80 rounded-3xl p-8 relative overflow-hidden shadow-sm">
        <div className="max-w-2xl">
          <span className="text-xs font-extrabold uppercase tracking-wider text-sky-600">Local-to-Public Platform</span>
          <h2 className="text-2xl font-bold text-slate-900 mt-1">Expose your local development PC securely to the internet</h2>
          <p className="text-sm text-slate-600 mt-2">
            Connect any local port (e.g. localhost:3000, 5000, 8000) through your Turnal Edge gateway without port forwarding or third-party dependencies.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Tunnels"
          value={stats?.activeTunnelsCount ?? 0}
          subtitle={`Total: ${stats?.totalTunnelsCount ?? 0}`}
          icon={Radio}
          iconColor="text-sky-600"
          iconBg="bg-sky-50 border-sky-200"
        />
        <StatCard
          title="Online Devices"
          value={stats?.onlineDevicesCount ?? 0}
          subtitle="Windows & CLI Agents"
          icon={Laptop}
          iconColor="text-indigo-600"
          iconBg="bg-indigo-50 border-indigo-200"
        />
        <StatCard
          title="Requests Today"
          value={stats?.totalRequestsToday ?? 0}
          subtitle={`Avg Latency: ${stats?.avgLatencyMs ?? 0}ms`}
          icon={Activity}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50 border-emerald-200"
        />
        <StatCard
          title="Total Bandwidth"
          value={formatBytes(stats?.totalBandwidthBytes ?? 0)}
          subtitle={`Error rate: ${stats?.errorRatePercent ?? 0}%`}
          icon={Database}
          iconColor="text-purple-600"
          iconBg="bg-purple-50 border-purple-200"
        />
      </div>

      {/* Interactive Quick Start & Setup Guide */}
      <QuickStartGuide />

      {/* Active Tunnels Section */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Active Tunnels</h3>
            <p className="text-xs text-slate-500 mt-0.5">Live connections from your local machines</p>
          </div>
          <Link
            href="/tunnels"
            className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
          >
            View All Tunnels <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-slate-400">Loading tunnels...</div>
        ) : tunnels.length === 0 ? (
          <div className="p-12 text-center">
            <Radio className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-600">No active tunnels right now</p>
            <p className="text-xs text-slate-400 mt-1">Start the Turnal agent on your Windows PC to see your live tunnels here</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {tunnels.slice(0, 5).map((t) => (
              <div key={t.id} className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${t.status === 'ONLINE' ? 'bg-emerald-500 shadow-md shadow-emerald-500/50 animate-pulse' : 'bg-slate-400'}`}></div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">{t.name}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-mono">
                        :{t.localTargetPort}
                      </span>
                    </div>
                    <div className="text-xs text-sky-600 font-mono mt-0.5">{t.publicUrl}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleCopy(t.publicUrl, t.id)}
                    className="p-2 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
                    title="Copy Public URL"
                  >
                    {copiedId === t.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <a
                    href={t.publicUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-lg bg-sky-50 border border-sky-200 text-sky-600 hover:bg-sky-100 transition-colors"
                    title="Open Public URL"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
