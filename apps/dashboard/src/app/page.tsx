'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchApi } from '../lib/api-client';
import { StatCard } from '../components/StatCard';
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

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
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
      <div className="bg-gradient-to-r from-sky-900/40 via-indigo-900/20 to-transparent border border-sky-500/20 rounded-3xl p-8 relative overflow-hidden">
        <div className="max-w-2xl">
          <span className="text-xs font-bold uppercase tracking-wider text-sky-400">Local-to-Public Platform</span>
          <h2 className="text-2xl font-bold text-white mt-1">Expose your local development PC securely to the internet</h2>
          <p className="text-sm text-slate-300 mt-2">
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
          iconColor="text-sky-400"
          iconBg="bg-sky-500/10 border-sky-500/20"
        />
        <StatCard
          title="Online Devices"
          value={stats?.onlineDevicesCount ?? 0}
          subtitle="Windows & CLI Agents"
          icon={Laptop}
          iconColor="text-indigo-400"
          iconBg="bg-indigo-500/10 border-indigo-500/20"
        />
        <StatCard
          title="Requests Today"
          value={stats?.totalRequestsToday ?? 0}
          subtitle={`Avg Latency: ${stats?.avgLatencyMs ?? 0}ms`}
          icon={Activity}
          iconColor="text-emerald-400"
          iconBg="bg-emerald-500/10 border-emerald-500/20"
        />
        <StatCard
          title="Total Bandwidth"
          value={formatBytes(stats?.totalBandwidthBytes ?? 0)}
          subtitle={`Error rate: ${stats?.errorRatePercent ?? 0}%`}
          icon={Database}
          iconColor="text-purple-400"
          iconBg="bg-purple-500/10 border-purple-500/20"
        />
      </div>

      {/* Quick Start Card */}
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Terminal className="w-5 h-5 text-sky-400" />
          <h3 className="text-base font-semibold text-white">Quick Start from your Windows PC</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#090d16] border border-[#1e293b] rounded-xl p-4">
            <span className="text-xs font-semibold text-slate-400">1. Authenticate CLI Agent</span>
            <div className="mt-2 flex items-center justify-between bg-[#11192e] px-3.5 py-2 rounded-lg font-mono text-xs text-sky-300">
              <span>turnal login</span>
              <button
                onClick={() => handleCopy('turnal login', 'cmd-1')}
                className="text-slate-400 hover:text-white"
              >
                {copiedId === 'cmd-1' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
          <div className="bg-[#090d16] border border-[#1e293b] rounded-xl p-4">
            <span className="text-xs font-semibold text-slate-400">2. Expose Local Application</span>
            <div className="mt-2 flex items-center justify-between bg-[#11192e] px-3.5 py-2 rounded-lg font-mono text-xs text-sky-300">
              <span>turnal tunnel --port 3000</span>
              <button
                onClick={() => handleCopy('turnal tunnel --port 3000', 'cmd-2')}
                className="text-slate-400 hover:text-white"
              >
                {copiedId === 'cmd-2' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Active Tunnels Section */}
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-[#1e293b] flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-white">Active Tunnels</h3>
            <p className="text-xs text-slate-400 mt-0.5">Live connections from your local machines</p>
          </div>
          <Link
            href="/tunnels"
            className="text-xs font-medium text-sky-400 hover:text-sky-300 flex items-center gap-1"
          >
            View All Tunnels <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-slate-500">Loading tunnels...</div>
        ) : tunnels.length === 0 ? (
          <div className="p-12 text-center">
            <Radio className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-400">No active tunnels right now</p>
            <p className="text-xs text-slate-500 mt-1">Start the Turnal agent on your Windows PC to see your live tunnels here</p>
          </div>
        ) : (
          <div className="divide-y divide-[#1e293b]">
            {tunnels.slice(0, 5).map((t) => (
              <div key={t.id} className="p-5 flex items-center justify-between hover:bg-[#131d36] transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${t.status === 'ONLINE' ? 'bg-emerald-400 shadow-lg shadow-emerald-500/50 animate-pulse' : 'bg-slate-600'}`}></div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">{t.name}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                        :{t.localTargetPort}
                      </span>
                    </div>
                    <div className="text-xs text-sky-400 font-mono mt-0.5">{t.publicUrl}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleCopy(t.publicUrl, t.id)}
                    className="p-2 rounded-lg bg-[#090d16] border border-[#1e293b] text-slate-400 hover:text-white transition-colors"
                    title="Copy Public URL"
                  >
                    {copiedId === t.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <a
                    href={t.publicUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 hover:bg-sky-500/20 transition-colors"
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
