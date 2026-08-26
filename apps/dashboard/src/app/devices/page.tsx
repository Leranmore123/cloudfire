'use client';

import React, { useEffect, useState } from 'react';
import { fetchApi } from '../../lib/api-client';
import { Laptop, Monitor, Terminal, Shield, Clock } from 'lucide-react';

export default function DevicesPage() {
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi('/api/devices').then((res) => {
      if (res.success) {
        setDevices(res.data || []);
      }
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Connected Devices</h2>
        <p className="text-sm text-slate-400">All authenticated Windows PCs and CLI instances running the Turnal agent</p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500">Loading devices...</div>
      ) : devices.length === 0 ? (
        <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-12 text-center">
          <Laptop className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white">No Connected Devices</h3>
          <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
            Log in with the Turnal CLI on your Windows machine to register it as an active device.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {devices.map((d) => (
            <div key={d.id} className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-6 relative">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
                    <Monitor className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{d.name}</h3>
                    <span className="text-xs text-slate-400 font-mono capitalize">{d.platform}</span>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    d.isOnline
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-pulse'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {d.isOnline ? 'ONLINE' : 'OFFLINE'}
                </span>
              </div>

              <div className="mt-6 pt-4 border-t border-[#1e293b] space-y-2 text-xs text-slate-400">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1"><Terminal className="w-3.5 h-3.5" /> Agent Version</span>
                  <span className="font-mono text-slate-200">{d.agentVersion}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5" /> IP Address</span>
                  <span className="font-mono text-slate-200">{d.ipAddress || '127.0.0.1'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Last Active</span>
                  <span className="text-slate-200">{new Date(d.lastSeenAt).toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
