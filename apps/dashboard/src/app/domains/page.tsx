'use client';

import React, { useEffect, useState } from 'react';
import { fetchApi } from '../../lib/api-client';
import { Globe, Plus, Trash2, CheckCircle2, AlertCircle, RefreshCw, Copy, Check } from 'lucide-react';

export default function DomainsPage() {
  const [domains, setDomains] = useState<any[]>([]);
  const [tunnels, setTunnels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [domainName, setDomainName] = useState('');
  const [targetTunnelId, setTargetTunnelId] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    const [domRes, tunRes] = await Promise.all([
      fetchApi('/api/domains'),
      fetchApi('/api/tunnels')
    ]);

    if (domRes.success) setDomains(domRes.data || []);
    if (tunRes.success) setTunnels(tunRes.data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleVerify = async (id: string) => {
    setVerifyingId(id);
    const res = await fetchApi(`/api/domains/${id}/verify`, {
      method: 'POST',
      body: JSON.stringify({ devBypass: true })
    });
    setVerifyingId(null);
    if (res.success) {
      alert('Domain successfully verified!');
      loadData();
    } else {
      alert(res.error?.message || 'Verification failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this domain?')) return;
    const res = await fetchApi(`/api/domains/${id}`, { method: 'DELETE' });
    if (res.success) {
      setDomains(domains.filter(d => d.id !== id));
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetchApi('/api/domains', {
      method: 'POST',
      body: JSON.stringify({
        domainName,
        targetTunnelId: targetTunnelId || undefined
      })
    });

    if (res.success) {
      setIsModalOpen(false);
      setDomainName('');
      setTargetTunnelId('');
      loadData();
    } else {
      alert(res.error?.message || 'Failed to add domain');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Custom Domains</h2>
          <p className="text-sm text-slate-400">Map your own custom domains to local tunnels with DNS verification</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="py-2.5 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-medium text-sm flex items-center gap-2 shadow-lg shadow-sky-500/20 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Custom Domain
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500">Loading domains...</div>
      ) : domains.length === 0 ? (
        <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-12 text-center">
          <Globe className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white">No Custom Domains</h3>
          <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
            Connect your own apex or subdomain (e.g. app.yourcompany.com) to your local application.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-6 py-2 px-4 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 hover:bg-sky-500/20 text-sm font-medium transition-colors"
          >
            Add Domain
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {domains.map((d) => (
            <div key={d.id} className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-6 relative">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg font-bold text-white font-mono">{d.domainName}</span>
                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                        d.verificationStatus === 'VERIFIED'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {d.verificationStatus === 'VERIFIED' ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" /> Verified
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3 h-3" /> Pending Verification
                        </>
                      )}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Mapped Tunnel: <span className="text-sky-400 font-medium">{d.targetTunnelName || 'None'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {d.verificationStatus !== 'VERIFIED' && (
                    <button
                      onClick={() => handleVerify(d.id)}
                      disabled={verifyingId === d.id}
                      className="py-2 px-3.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${verifyingId === d.id ? 'animate-spin' : ''}`} />
                      {verifyingId === d.id ? 'Checking DNS...' : 'Verify DNS'}
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(d.id)}
                    className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* DNS Instructions Box */}
              {d.verificationStatus !== 'VERIFIED' && (
                <div className="mt-6 bg-[#090d16] rounded-xl p-4 border border-[#1e293b] space-y-3">
                  <div className="text-xs font-semibold text-slate-300">Required DNS Configuration:</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="bg-[#11192e] p-3 rounded-lg border border-[#1e293b]">
                      <div className="text-slate-400 font-semibold mb-1">1. TXT Verification Record</div>
                      <div className="font-mono text-slate-300 flex items-center justify-between">
                        <span className="truncate mr-2">Host: {d.dnsTxtRecord}</span>
                        <button onClick={() => handleCopy(d.dnsTxtRecord, `txt-h-${d.id}`)}>
                          {copiedId === `txt-h-${d.id}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                        </button>
                      </div>
                      <div className="font-mono text-sky-300 flex items-center justify-between mt-1">
                        <span className="truncate mr-2">Value: turnal-verification={d.verificationToken}</span>
                        <button onClick={() => handleCopy(`turnal-verification=${d.verificationToken}`, `txt-v-${d.id}`)}>
                          {copiedId === `txt-v-${d.id}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                        </button>
                      </div>
                    </div>

                    <div className="bg-[#11192e] p-3 rounded-lg border border-[#1e293b]">
                      <div className="text-slate-400 font-semibold mb-1">2. CNAME Routing Record</div>
                      <div className="font-mono text-slate-300 flex items-center justify-between">
                        <span>Host: {d.domainName}</span>
                      </div>
                      <div className="font-mono text-indigo-300 flex items-center justify-between mt-1">
                        <span>Target: {d.dnsCnameTarget}</span>
                        <button onClick={() => handleCopy(d.dnsCnameTarget, `cname-${d.id}`)}>
                          {copiedId === `cname-${d.id}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0f172a] border border-[#1e293b] rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">Add Custom Domain</h3>
            <p className="text-xs text-slate-400 mb-4">Enter your custom domain or subdomain to route traffic.</p>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Domain Name</label>
                <input
                  type="text"
                  required
                  value={domainName}
                  onChange={(e) => setDomainName(e.target.value)}
                  placeholder="app.mycompany.com"
                  className="w-full bg-[#090d16] border border-[#1e293b] rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Target Tunnel</label>
                <select
                  value={targetTunnelId}
                  onChange={(e) => setTargetTunnelId(e.target.value)}
                  className="w-full bg-[#090d16] border border-[#1e293b] rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                >
                  <option value="">Select a tunnel (Optional)</option>
                  {tunnels.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} (:{t.localTargetPort})
                    </option>
                  ))}
                </select>
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
                  Add Domain
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
