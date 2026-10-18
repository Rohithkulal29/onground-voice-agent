import React from 'react';
import { Mic, Radio, RefreshCw, Settings, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

export default function Header({ backendHealth, onRefresh, onOpenSettings, isRefreshing }) {
  return (
    <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-xl sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Brand Logo & Title */}
        <div className="flex items-center space-x-3.5">
          <div className="relative">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/25 ring-1 ring-white/20">
              <Mic className="w-5 h-5 text-white animate-pulse" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                On-Ground<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">.ai</span>
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                Agentic OS
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Autonomous Voice AI for In-Store Retail Marketing & Outbound Promotions
            </p>
          </div>
        </div>

        {/* Status Indicators & Controls */}
        <div className="flex items-center flex-wrap gap-2.5 w-full md:w-auto justify-end">
          {/* Backend Status Badge */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border ${
            backendHealth.online
              ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30'
              : 'bg-rose-950/40 text-rose-300 border-rose-500/30'
          }`}>
            {backendHealth.online ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Backend Online</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                <span>Backend Disconnected</span>
              </>
            )}
          </div>

          {/* Vapi PSTN Status Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border bg-slate-800/80 text-slate-300 border-slate-700">
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            <span>PSTN Outbound + WebRTC</span>
          </div>

          {/* Refresh Leads Button */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition disabled:opacity-50"
            title="Refresh Leads Queue"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
            <span>Sync</span>
          </button>

          {/* Settings / Configuration Button */}
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-indigo-600/90 to-indigo-700/90 hover:from-indigo-500 hover:to-indigo-600 text-white shadow-md shadow-indigo-600/20 border border-indigo-400/20 transition"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Vapi Config</span>
          </button>
        </div>
      </div>
    </header>
  );
}
