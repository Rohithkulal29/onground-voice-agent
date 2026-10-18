import React, { useState } from 'react';
import { FileText, Copy, Check, User, Store, Phone, Clock, Sparkles } from 'lucide-react';

export default function TranscriptModal({ lead, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!lead) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(lead.transcript || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="glass-panel w-full max-w-2xl rounded-3xl border border-slate-700/80 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Call Transcript & Log</h3>
              <p className="text-xs text-slate-400">Archived recording of voice AI dialogue</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Transcript'}</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Lead Metadata */}
        <div className="px-6 py-3 bg-slate-900/40 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <User className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-semibold text-white">{lead.customer_name}</span>
            <span className="text-slate-500">|</span>
            <span className="font-mono text-slate-400">{lead.phone_number}</span>
          </div>

          <div className="flex items-center gap-2 text-slate-300">
            <Store className="w-3.5 h-3.5 text-cyan-400" />
            <span>{lead.store_branch}</span>
          </div>
        </div>

        {/* Campaign Offer Tag */}
        <div className="px-6 py-2 bg-indigo-950/20 border-b border-indigo-900/30 flex items-center gap-2 text-xs text-indigo-200">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span className="font-medium text-slate-300">Target Offer:</span>
          <span className="truncate">{lead.campaign_offer}</span>
        </div>

        {/* Transcript Body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-950/50">
          {lead.transcript ? (
            <div className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-slate-200 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
              {lead.transcript}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-500 text-xs italic">
              No transcript recorded for this lead yet.
            </div>
          )}

          {lead.call_id && (
            <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500 font-mono">
              <span>Vapi Call ID: {lead.call_id}</span>
              <span>Logged at: {lead.created_at}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-900/80 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
