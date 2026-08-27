'use client';

import React, { useState } from 'react';
import { copyToClipboard } from '../lib/clipboard';
import { Terminal, Copy, Check, ExternalLink, Globe, Laptop, Server, Zap, Info, ShieldCheck, Download } from 'lucide-react';

interface QuickStartGuideProps {
  apiKey?: string;
  defaultPort?: string;
}

export function QuickStartGuide({ apiKey = 'trk_live_43021d2c8ab8a30c79ed6402964cbb3d1ed62d86464df1b9', defaultPort = '3001' }: QuickStartGuideProps) {
  const [port, setPort] = useState(defaultPort);
  const [subdomain, setSubdomain] = useState('app');
  const [baseDomain, setBaseDomain] = useState('skyranksolution.com');
  const [useNpx, setUseNpx] = useState(true);

  const [copiedCmd, setCopiedCmd] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const sub = subdomain.trim() || 'app';
  const domain = baseDomain.trim() || 'skyranksolution.com';
  const fullDomain = `${sub}.${domain}`;
  const liveUrl = `https://${fullDomain}`;

  const generatedCommand = useNpx
    ? `turnal tunnel --port ${port || '5173'} --domain ${fullDomain} --edge-ws wss://app.skyranksolution.com/tunnel/connect --api-key ${apiKey}`
    : `node cli.mjs tunnel --port ${port || '5173'} --domain ${fullDomain} --edge-ws wss://app.skyranksolution.com/tunnel/connect --api-key ${apiKey}`;

  const handleCopyCmd = async () => {
    const success = await copyToClipboard(generatedCommand);
    if (success) {
      setCopiedCmd(true);
      setTimeout(() => setCopiedCmd(false), 2000);
    }
  };

  const handleCopyUrl = async () => {
    const success = await copyToClipboard(liveUrl);
    if (success) {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm relative overflow-hidden">
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-sky-50 border border-sky-200 text-sky-600">
              <Zap className="w-5 h-5" />
            </span>
            <h3 className="text-xl font-bold text-slate-900">Interactive Setup, Domain & Help Guide</h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Expose any local project running on your PC (e.g. Next.js, React, Node, Python) with custom domain support.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-xs font-semibold text-emerald-700">Turnal Edge Gateway Online</span>
        </div>
      </div>

      {/* Step-by-Step Guide Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Step 1: Run Local Server */}
        <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-5 space-y-3 relative group hover:border-sky-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold px-2.5 py-1 rounded-md bg-sky-100 text-sky-700 border border-sky-200">
              STEP 1
            </span>
            <Laptop className="w-4 h-4 text-slate-400" />
          </div>
          <h4 className="text-sm font-bold text-slate-900">Run your Local Application</h4>
          <p className="text-xs text-slate-500">
            Start your project server on your local machine (e.g. <code className="text-sky-700 font-bold">npm run dev</code>).
          </p>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 font-mono text-[11px] text-slate-200 space-y-1">
            <div className="text-emerald-400 font-semibold">✔ Ready on local network:</div>
            <div className="text-slate-300">- Local: <span className="text-sky-300 font-bold">http://localhost:{port || '3001'}</span></div>
            <div className="text-slate-400">- Network: http://192.168.1.9:{port || '3001'}</div>
          </div>
        </div>

        {/* Step 2: Configure Local Target Port & Custom Domain */}
        <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-5 space-y-3 relative group hover:border-indigo-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold px-2.5 py-1 rounded-md bg-indigo-100 text-indigo-700 border border-indigo-200">
              STEP 2
            </span>
            <Server className="w-4 h-4 text-slate-400" />
          </div>
          <h4 className="text-sm font-bold text-slate-900">Target Port & Custom Domain Setup</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            <div>
              <label className="text-[11px] font-bold text-slate-600 mb-1 block">Local Port</label>
              <input
                type="number"
                value={port}
                onChange={(e) => setPort(e.target.value)}
                placeholder="3001"
                className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3 py-1.5 text-xs text-slate-900 outline-none font-mono"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-600 mb-1 block">Subdomain</label>
              <input
                type="text"
                value={subdomain}
                onChange={(e) => setSubdomain(e.target.value)}
                placeholder="app"
                className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3 py-1.5 text-xs text-slate-900 outline-none font-mono"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-600 mb-1 block">Main Domain</label>
              <input
                type="text"
                value={baseDomain}
                onChange={(e) => setBaseDomain(e.target.value)}
                placeholder="skyranksolution.com"
                className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3 py-1.5 text-xs text-slate-900 outline-none font-mono"
              />
            </div>
          </div>
        </div>

      </div>

      {/* DNS Provider Guidance Box */}
      <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-amber-800">
          <Info className="w-4 h-4 text-amber-600" />
          <h4 className="text-xs font-bold uppercase tracking-wider">DNS Setup Suggestion for {domain}</h4>
        </div>
        <p className="text-xs text-slate-600">
          To point your custom domain (<code className="text-amber-800 font-bold">{fullDomain}</code>) to Turnal, add this <strong>A Record</strong> in your DNS provider (Hostinger, Cloudflare, GoDaddy):
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs border border-amber-200 rounded-xl overflow-hidden bg-white">
            <thead className="bg-amber-100/60 text-slate-700 uppercase text-[10px]">
              <tr>
                <th className="p-2.5 border-b border-amber-200">Type</th>
                <th className="p-2.5 border-b border-amber-200">Name / Host</th>
                <th className="p-2.5 border-b border-amber-200">Points To (Value)</th>
                <th className="p-2.5 border-b border-amber-200">Recommended TTL</th>
              </tr>
            </thead>
            <tbody className="text-slate-900">
              <tr>
                <td className="p-2.5 border-b border-slate-100 font-bold text-amber-600">A</td>
                <td className="p-2.5 border-b border-slate-100 text-sky-700 font-bold">{sub}</td>
                <td className="p-2.5 border-b border-slate-100 text-emerald-700 font-bold">13.62.54.247</td>
                <td className="p-2.5 border-b border-slate-100 text-purple-700">300 (5 mins)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Step 3: Generated CLI Command & One-Click Copy */}
      <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold px-2.5 py-1 rounded-md bg-purple-100 text-purple-700 border border-purple-200">
              STEP 3
            </span>
            <h4 className="text-sm font-bold text-slate-900">Execute Terminal Command (No Code Install Needed)</h4>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-slate-200 border border-slate-300 rounded-lg p-1 text-[11px]">
              <button
                onClick={() => setUseNpx(true)}
                className={`px-2.5 py-1 rounded-md font-bold transition-colors ${useNpx ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
              >
                turnal CLI
              </button>
              <button
                onClick={() => setUseNpx(false)}
                className={`px-2.5 py-1 rounded-md font-bold transition-colors ${!useNpx ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
              >
                node cli.mjs
              </button>
            </div>

            <a
              href="/cli.mjs"
              download="cli.mjs"
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-1.5 rounded-xl text-xs transition-colors shadow-sm"
              title="Download standalone cli.mjs file for your PC/friend"
            >
              <Download className="w-3.5 h-3.5" /> Download cli.mjs
            </a>

            <button
              onClick={handleCopyCmd}
              className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white font-bold px-4 py-1.5 rounded-xl text-xs transition-colors shadow-sm"
            >
              {copiedCmd ? (
                <>
                  <Check className="w-3.5 h-3.5" /> Copied Command!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> Copy Command
                </>
              )}
            </button>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 font-mono text-xs text-sky-300 break-all select-all flex items-center justify-between gap-3 shadow-inner">
          <span>{generatedCommand}</span>
        </div>
      </div>

      {/* Step 4: Access Live Public URL */}
      <div className="bg-gradient-to-r from-emerald-500/10 via-slate-50 to-white border border-emerald-200 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-700 border border-emerald-200">
              STEP 4
            </span>
            <h4 className="text-sm font-bold text-slate-900">Access Your Public Live URL</h4>
          </div>
          <p className="text-xs text-slate-500">
            Once you run the command in your terminal, your local project will be accessible worldwide at:
          </p>
          <div className="text-sm font-mono font-bold text-emerald-600 pt-1">{liveUrl}</div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyUrl}
            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors shadow-sm"
            title="Copy Public URL"
          >
            {copiedUrl ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          </button>
          <a
            href={liveUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors shadow-sm"
          >
            Open Live URL <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
