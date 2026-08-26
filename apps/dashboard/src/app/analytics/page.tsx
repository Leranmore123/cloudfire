'use client';

import React, { useEffect, useState } from 'react';
import { fetchApi } from '../../lib/api-client';
import { BarChart3, RefreshCw, Activity, CheckCircle, AlertTriangle, Clock } from 'lucide-react';

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const loadData = async () => {
    const [overviewRes, logsRes] = await Promise.all([
      fetchApi('/api/analytics/overview'),
      fetchApi('/api/analytics/logs')
    ]);

    if (overviewRes.success) setAnalytics(overviewRes.data);
    if (logsRes.success) setLogs(logsRes.data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    let interval: any = null;
    if (autoRefresh) {
      interval = setInterval(loadData, 3000); // 3-second live refresh
    }
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const getMethodBadgeColor = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET': return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
      case 'POST': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'PUT': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'DELETE': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default: return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  const getStatusBadgeColor = (code: number) => {
    if (code < 300) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    if (code < 400) return 'text-sky-400 bg-sky-500/10 border-sky-500/20';
    if (code < 500) return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Analytics & Live Telemetry</h2>
          <p className="text-sm text-slate-400">Real-time traffic inspection, latency monitoring, and request logs</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`py-2 px-3.5 rounded-xl border text-xs font-medium flex items-center gap-2 transition-colors ${
              autoRefresh
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-[#0f172a] border-[#1e293b] text-slate-400'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`}></span>
            {autoRefresh ? 'Live Streaming' : 'Paused'}
          </button>
          <button
            onClick={loadData}
            className="p-2 rounded-xl bg-[#0f172a] border border-[#1e293b] text-slate-400 hover:text-white transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Hourly Requests Histogram Visualization */}
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-6">
        <h3 className="text-base font-semibold text-white mb-4">Traffic Volume (24 Hours)</h3>
        {analytics?.requestsTimeline && (
          <div className="h-40 flex items-end gap-1.5 pt-4">
            {analytics.requestsTimeline.map((bucket: any, idx: number) => {
              const maxReqs = Math.max(...analytics.requestsTimeline.map((b: any) => b.requests), 10);
              const heightPct = Math.max((bucket.requests / maxReqs) * 100, 4);
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                  <div
                    style={{ height: `${heightPct}%` }}
                    className={`w-full rounded-t-sm transition-all duration-300 ${
                      bucket.errors > 0 ? 'bg-rose-500' : 'bg-gradient-to-t from-sky-600 to-sky-400 group-hover:from-sky-500 group-hover:to-sky-300'
                    }`}
                  ></div>
                  <span className="text-[9px] text-slate-500 rotate-45 origin-left truncate hidden md:block">
                    {bucket.timestamp}
                  </span>
                  {/* Tooltip */}
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-700 px-2 py-1 rounded text-[10px] text-white opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-10">
                    {bucket.requests} requests ({bucket.avgLatencyMs}ms)
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Live Request Logs Table */}
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-[#1e293b] flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-white">Live Request Stream</h3>
            <p className="text-xs text-slate-400 mt-0.5">Incoming requests proxied to your local machines</p>
          </div>
          <span className="text-xs text-slate-500">{logs.length} events</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500">Loading requests...</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-500">No requests recorded yet. Open your public tunnel URL to generate traffic.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#090d16] text-slate-400 uppercase tracking-wider font-semibold border-b border-[#1e293b]">
                <tr>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Path</th>
                  <th className="py-3 px-4">Tunnel</th>
                  <th className="py-3 px-4">Latency</th>
                  <th className="py-3 px-4">Payload</th>
                  <th className="py-3 px-4">Client IP</th>
                  <th className="py-3 px-4">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e293b]/60 font-mono">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#131d36] transition-colors">
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full border text-[11px] font-bold ${getStatusBadgeColor(log.statusCode)}`}>
                        {log.statusCode}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${getMethodBadgeColor(log.method)}`}>
                        {log.method}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-200 truncate max-w-xs">{log.path}</td>
                    <td className="py-3 px-4 text-sky-400 font-sans">{log.subdomain || log.tunnelName}</td>
                    <td className="py-3 px-4 text-slate-300">{log.durationMs}ms</td>
                    <td className="py-3 px-4 text-slate-400">
                      {log.bytesIn + log.bytesOut > 0 ? `${log.bytesIn + log.bytesOut} B` : '-'}
                    </td>
                    <td className="py-3 px-4 text-slate-500 truncate max-w-[120px]">{log.clientIp || '127.0.0.1'}</td>
                    <td className="py-3 px-4 text-slate-500 font-sans">{new Date(log.timestamp).toLocaleTimeString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
