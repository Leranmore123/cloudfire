'use client';

import React, { useEffect, useState } from 'react';
import { fetchApi } from '../../lib/api-client';
import { User, Shield, CreditCard, CheckCircle2 } from 'lucide-react';

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi('/api/auth/me').then((res) => {
      if (res.success) {
        setUser(res.data);
      }
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold text-white">Account Settings</h2>
        <p className="text-sm text-slate-400">Manage your profile, plan limits, and security preferences</p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500">Loading settings...</div>
      ) : (
        <div className="space-y-6">
          {/* Profile Card */}
          <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <User className="w-5 h-5 text-sky-400" />
              <h3 className="text-base font-semibold text-white">Profile Details</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Full Name</label>
                <div className="bg-[#090d16] border border-[#1e293b] rounded-xl px-3.5 py-2.5 text-sm text-white">
                  {user?.name}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Email Address</label>
                <div className="bg-[#090d16] border border-[#1e293b] rounded-xl px-3.5 py-2.5 text-sm text-white">
                  {user?.email}
                </div>
              </div>
            </div>
          </div>

          {/* Plan & Subscription */}
          <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <CreditCard className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-semibold text-white">Current Subscription & Limits</h3>
            </div>

            <div className="bg-[#090d16] border border-[#1e293b] rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">Plan Active</span>
                <h4 className="text-lg font-bold text-white mt-0.5">Free Developer Plan</h4>
                <p className="text-xs text-slate-400 mt-1">Unlimited HTTP/HTTPS local-to-public tunneling</p>
              </div>

              <div className="flex items-center gap-6 text-xs text-slate-300">
                <div>
                  <div className="text-slate-500 font-semibold mb-0.5">Max Tunnels</div>
                  <div className="text-base font-bold text-white">3 Concurrent</div>
                </div>
                <div>
                  <div className="text-slate-500 font-semibold mb-0.5">Custom Domains</div>
                  <div className="text-base font-bold text-white">1 Active</div>
                </div>
                <div>
                  <div className="text-slate-500 font-semibold mb-0.5">Monthly Bandwidth</div>
                  <div className="text-base font-bold text-white">10 GB</div>
                </div>
              </div>
            </div>
          </div>

          {/* Security & Protocol Settings */}
          <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-semibold text-white">Tunnel Protocol Security</h3>
            </div>
            <div className="space-y-3 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Outbound persistent TLS connection (no inbound router ports needed)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Cryptographic SHA-256 hashed API key authentication</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Multiplexed binary frame streaming with auto-reconnection and heartbeats</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
