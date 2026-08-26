'use client';

import React, { useEffect, useState } from 'react';
import { fetchApi } from '../../lib/api-client';
import { Radio, Plus, Trash2, Copy, Check, ExternalLink, Activity, Server, Clock } from 'lucide-react';

export default function TunnelsPage() {
  const [tunnels, setTunnels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [port, setPort] = useState('3000');

  const loadTunnels = async () => {
    setLoading(true);
    const res = await fetchApi('/api/tunnels');
    if (res.success) {
      setTunnels(res.data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadTunnels();
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tunnel?')) return;
    const res = await fetchApi(`/api/tunnels/${id}`, { method: 'DELETE' });
    if (res.success) {
      setTunnels(tunnels.filter(t => t.id !== id));
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetchApi('/api/tunnels', {
      method: 'POST',
      body: JSON.stringify({
        name,
        subdomain: subdomain || undefined,
        localTargetPort: parseInt(port, 10),
      })
    });
    if (res.success) {
      setIsModalOpen(false);
      setName('');
      setSubdomain('');
      setPort('3000');
      loadTunnels();
    } else {
      alert(res.error?.message || 'Failed to create tunnel');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Tunnels</h2>
          <p className="text-sm text-slate-400">Manage and monitor your active and configured tunnels</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="py-2.5 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-medium text-sm flex items-center gap-2 shadow-lg shadow-sky-500/20 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create / Reserve Tunnel
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500">Loading tunnels...</div>
      ) : tunnels.length === 0 ? (
        <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-12 text-center">
          <Radio className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white">No Tunnels Found</h3>
          <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
            You haven&apos;t created any tunnels yet. Start one from the CLI or reserve a subdomain here.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-6 py-2 px-4 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 hover:bg-sky-500/20 text-sm font-medium transition-colors"
          >
            Create Your First Tunnel
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tunnels.map((t) => (
            <div key={t.id} className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-6 relative group hover:border-slate-700 transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-base font-bold text-white">{t.name}</span>
                    <span
                      className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                        t.status === 'ONLINE'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-pulse'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>
                  <div className="text-xs text-sky-400 font-mono mt-1.5 flex items-center gap-1.5">
                    <span>{t.publicUrl}</span>
                  </div>
                  {t.customDomain && (
                    <div className="text-xs text-indigo-400 font-mono mt-0.5">
                      {t.customDomain}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(t.publicUrl, t.id)}
                    className="p-2 rounded-lg bg-[#090d16] border border-[#1e293b] text-slate-400 hover:text-white transition-colors"
                    title="Copy URL"
                  >
                    {copiedId === t.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <a
                    href={t.publicUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 hover:bg-sky-500/20 transition-colors"
                    title="Open Link"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => handleDelete(t.id)}
                    className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-colors"
                    title="Delete Tunnel"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[#1e293b] grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-[#090d16] rounded-xl p-2.5 border border-[#1e293b]">
                  <div className="text-slate-500 flex items-center justify-center gap-1 mb-1">
                    <Server className="w-3.5 h-3.5" /> Target
                  </div>
                  <div className="font-semibold text-slate-200">:{t.localTargetPort}</div>
                </div>
                <div className="bg-[#090d16] rounded-xl p-2.5 border border-[#1e293b]">
                  <div className="text-slate-500 flex items-center justify-center gap-1 mb-1">
                    <Activity className="w-3.5 h-3.5" /> Requests
                  </div>
                  <div className="font-semibold text-slate-200">{t.totalRequests || 0}</div>
                </div>
                <div className="bg-[#090d16] rounded-xl p-2.5 border border-[#1e293b]">
                  <div className="text-slate-500 flex items-center justify-center gap-1 mb-1">
                    <Clock className="w-3.5 h-3.5" /> Heartbeat
                  </div>
                  <div className="font-semibold text-slate-200">
                    {t.lastHeartbeatAt ? new Date(t.lastHeartbeatAt).toLocaleTimeString() : 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0f172a] border border-[#1e293b] rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">Reserve a New Tunnel</h3>
            <p className="text-xs text-slate-400 mb-4">Assign a permanent subdomain and local port.</p>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Tunnel / Project Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="My NextJS App"
                  className="w-full bg-[#090d16] border border-[#1e293b] rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Subdomain (Optional)</label>
                <input
                  type="text"
                  value={subdomain}
                  onChange={(e) => setSubdomain(e.target.value)}
                  placeholder="my-cool-app (leave blank for random)"
                  className="w-full bg-[#090d16] border border-[#1e293b] rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Default Local Port</label>
                <input
                  type="number"
                  required
                  value={port}
                  onChange={(e) => setPort(e.target.value)}
                  placeholder="3000"
                  className="w-full bg-[#090d16] border border-[#1e293b] rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-sm font-medium"
                >
                  Create Tunnel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
