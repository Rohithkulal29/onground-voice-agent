import React, { useState, useEffect } from 'react';
import { Settings, Key, Phone, Bot, Check, ExternalLink, ShieldCheck, HelpCircle } from 'lucide-react';

export default function SettingsModal({ onClose, defaultPublicKey, defaultAssistantId, onKeysUpdated }) {
  const [publicKey, setPublicKey] = useState(
    localStorage.getItem('vapi_public_key') || defaultPublicKey || ''
  );
  const [assistantId, setAssistantId] = useState(
    localStorage.getItem('vapi_assistant_id') || defaultAssistantId || ''
  );
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    localStorage.setItem('vapi_public_key', publicKey.trim());
    localStorage.setItem('vapi_assistant_id', assistantId.trim());
    if (onKeysUpdated) {
      onKeysUpdated({
        publicKey: publicKey.trim(),
        assistantId: assistantId.trim()
      });
    }
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="glass-panel w-full max-w-xl rounded-3xl border border-slate-700/80 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Vapi Voice OS Credentials</h3>
              <p className="text-xs text-slate-400">Configure keys for PSTN telephone dialing and WebRTC</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Vapi Web Public Key</span>
                </span>
                <span className="text-[11px] text-slate-500 font-normal">Used by WebRTC browser mic</span>
              </label>
              <input
                type="text"
                placeholder="e.g. 5e91c2... (Org Settings -> API Keys -> Public Key)"
                value={publicKey}
                onChange={(e) => setPublicKey(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Bot className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Vapi Assistant ID</span>
                </span>
                <span className="text-[11px] text-slate-500 font-normal">Used for Voice Persona</span>
              </label>
              <input
                type="text"
                placeholder="e.g. a78bc1... (From Assistants tab in Vapi)"
                value={assistantId}
                onChange={(e) => setAssistantId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition"
              >
                {saved ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <span>Save Web Keys</span>
                )}
              </button>
            </div>
          </form>

          {/* Guide Card */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-indigo-300 font-semibold text-xs">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span>Full-Stack Calling Architecture Overview</span>
            </div>

            <ul className="space-y-2 text-slate-400 leading-relaxed list-disc list-inside">
              <li>
                <strong className="text-slate-200">Phone Calls (PSTN):</strong> The backend reads <code className="text-indigo-300">VAPI_PRIVATE_KEY</code>, <code className="text-indigo-300">VAPI_PHONE_NUMBER_ID</code>, and <code className="text-indigo-300">VAPI_ASSISTANT_ID</code> from <code className="text-slate-300">backend/.env</code> and calls <code className="text-cyan-300">https://api.vapi.ai/call</code>.
              </li>
              <li>
                <strong className="text-slate-200">Live Browser Calls (WebRTC):</strong> Evaluators can speak directly with the AI voice model through their laptop/desktop microphone using <code className="text-cyan-300">@vapi-ai/web</code> without requiring telephone SIM card or credits.
              </li>
              <li>
                <strong className="text-slate-200">Webhooks:</strong> Point your Vapi Server URL / Webhook to:
                <div className="mt-1 p-2 rounded-lg bg-slate-950 font-mono text-[11px] text-cyan-300 select-all border border-slate-800">
                  POST http://&lt;your-domain-or-ngrok&gt;:8000/api/webhooks/vapi
                </div>
              </li>
            </ul>

            <div className="pt-1">
              <a
                href="https://dashboard.vapi.ai"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 font-semibold"
              >
                <span>Open Vapi.ai Dashboard</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

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
