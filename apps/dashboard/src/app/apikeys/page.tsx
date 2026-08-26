'use client';

import React, { useEffect, useState } from 'react';
import { fetchApi } from '../../lib/api-client';
import { KeyRound, Plus, Trash2, Copy, Check, ShieldAlert } from 'lucide-react';

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [newKey, setNewKey] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);

  const loadKeys = async () => {
    setLoading(true);
    const res = await fetchApi('/api/apikeys');
    if (res.success) {
      setKeys(res.data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadKeys();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this API key?')) return;
    const res = await fetchApi(`/api/apikeys/${id}`, { method: 'DELETE' });
    if (res.success) {
      setKeys(keys.filter(k => k.id !== id));
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetchApi('/api/apikeys', {
      method: 'POST',
      body: JSON.stringify({ name, expiresInDays: 90 })
    });

    if (res.success && res.data) {
      setNewKey(res.data);
      setName('');
      loadKeys();
    } else {
      alert(res.error?.message || 'Failed to create API key');
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">API Keys</h2>
          <p className="text-sm text-slate-400">Authenticate tunnel agents and CI/CD pipelines without passwords</p>
        </div>
        <button
          onClick={() => {
            setNewKey(null);
            setIsModalOpen(true);
          }}
          className="py-2.5 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-medium text-sm flex items-center gap-2 shadow-lg shadow-sky-500/20 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Generate New Key
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500">Loading API keys...</div>
      ) : keys.length === 0 ? (
        <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-12 text-center">
          <KeyRound className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white">No API Keys Generated</h3>
          <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
            Generate an API key to run headless tunnel agents on servers or embedded systems.
          </p>
        </div>
      ) : (
        <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl overflow-hidden divide-y divide-[#1e293b]">
          {keys.map((k) => (
            <div key={k.id} className="p-5 flex items-center justify-between hover:bg-[#131d36] transition-colors">
              <div>
                <span className="text-sm font-semibold text-white">{k.name}</span>
                <div className="text-xs text-slate-400 font-mono mt-1">{k.keyPrefix}</div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right text-xs text-slate-400">
                  <div>Created: {new Date(k.createdAt).toLocaleDateString()}</div>
                  <div className="text-slate-500">Last used: {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleDateString() : 'Never'}</div>
                </div>
                <button
                  onClick={() => handleDelete(k.id)}
                  className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-colors"
                  title="Revoke Key"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0f172a] border border-[#1e293b] rounded-3xl p-6 max-w-md w-full shadow-2xl">
            {!newKey ? (
              <>
                <h3 className="text-lg font-bold text-white mb-1">Generate API Key</h3>
                <p className="text-xs text-slate-400 mb-4">Enter a memorable label for this key.</p>

                <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Key Name / Label</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Home Windows PC / CI Pipeline"
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
                      Generate Key
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
                  <KeyRound className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white mb-1">Save Your API Key</h3>
                <p className="text-xs text-amber-400 mb-4 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  Copy this key now. It will never be displayed again.
                </p>

                <div className="bg-[#090d16] border border-[#1e293b] rounded-xl p-3 flex items-center justify-between font-mono text-xs text-sky-300">
                  <span className="truncate mr-2">{newKey.apiKey}</span>
                  <button
                    onClick={() => handleCopy(newKey.apiKey)}
                    className="p-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-white"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                <div className="flex items-center justify-end mt-6">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium"
                  >
                    Done
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
