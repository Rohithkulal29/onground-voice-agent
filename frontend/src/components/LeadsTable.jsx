import React, { useState } from 'react';
import { 
  Phone, 
  Mic, 
  RotateCcw, 
  FileText, 
  Search, 
  Building, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  PhoneOutgoing,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';

export default function LeadsTable({ 
  leads, 
  onCallPSTN, 
  onStartWebRTC, 
  onViewTranscript, 
  onResetLead, 
  callingLeadId 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [copiedId, setCopiedId] = useState(null);

  const handleCopyCallId = (callId) => {
    if (!callId) return;
    navigator.clipboard.writeText(callId);
    setCopiedId(callId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.store_branch.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.campaign_offer.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || lead.call_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Calling':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <span className="flex h-1.5 w-1.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-500"></span>
            </span>
            Calling...
          </span>
        );
      case 'In-Progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
            <span className="flex h-1.5 w-1.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-500"></span>
            </span>
            In-Progress
          </span>
        );
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            Completed
          </span>
        );
      case 'Failed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <AlertCircle className="w-3 h-3 text-rose-400" />
            Failed
          </span>
        );
      case 'Pending':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <Clock className="w-3 h-3 text-amber-400" />
            Pending
          </span>
        );
    }
  };

  return (
    <div className="glass-card rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
      {/* Table Header & Controls */}
      <div className="p-5 border-b border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-white">Live Campaign Outbound Queue</h2>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
              {filteredLeads.length} {filteredLeads.length === 1 ? 'Lead' : 'Leads'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Test real calls using PSTN Phone Dispatch or direct in-browser WebRTC microphone
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Search Input */}
          <div className="relative flex-1 md:w-56">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search leads, store..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Calling">Calling</option>
            <option value="In-Progress">In-Progress</option>
            <option value="Completed">Completed</option>
            <option value="Failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Leads Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800/80 bg-slate-900/60 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <th className="py-3 px-4">Lead # & Customer</th>
              <th className="py-3 px-4">Store Branch</th>
              <th className="py-3 px-4">Campaign Offer</th>
              <th className="py-3 px-4">Call Status</th>
              <th className="py-3 px-4">Transcript & Call ID</th>
              <th className="py-3 px-4 text-right">Voice Agent Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-xs">
            {filteredLeads.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-12 text-center text-slate-500">
                  <p className="text-sm">No campaign leads matching criteria.</p>
                  <p className="text-xs text-slate-600 mt-1">Add a new lead using the form above.</p>
                </td>
              </tr>
            ) : (
              filteredLeads.map((lead) => {
                const isCallingThis = callingLeadId === lead.id;
                const hasTranscript = Boolean(lead.transcript && lead.transcript.trim());

                return (
                  <tr key={lead.id} className="hover:bg-slate-900/40 transition-colors">
                    {/* Customer Info */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white text-sm">
                        {lead.customer_name}
                      </div>
                      <div className="font-mono text-slate-400 text-[11px] flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-500" />
                        <span>{lead.phone_number}</span>
                      </div>
                    </td>

                    {/* Store Branch */}
                    <td className="py-3.5 px-4 text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span className="font-medium">{lead.store_branch}</span>
                      </div>
                    </td>

                    {/* Campaign Offer */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <span className="inline-block text-slate-300 bg-slate-900/80 border border-slate-700/60 rounded-lg px-2.5 py-1 text-xs leading-relaxed line-clamp-2">
                        {lead.campaign_offer}
                      </span>
                    </td>

                    {/* Call Status */}
                    <td className="py-3.5 px-4">
                      {getStatusBadge(lead.call_status)}
                    </td>

                    {/* Transcript & Call ID */}
                    <td className="py-3.5 px-4">
                      {hasTranscript ? (
                        <button
                          onClick={() => onViewTranscript(lead)}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 transition text-xs font-medium"
                        >
                          <FileText className="w-3.5 h-3.5 text-indigo-400" />
                          <span>View Transcript</span>
                        </button>
                      ) : lead.call_id ? (
                        <div className="flex items-center gap-1 font-mono text-[10px] text-slate-400">
                          <span title={lead.call_id}>
                            {lead.call_id.length > 14 ? lead.call_id.substring(0, 12) + '...' : lead.call_id}
                          </span>
                          <button
                            onClick={() => handleCopyCallId(lead.call_id)}
                            className="p-1 hover:text-white transition"
                            title="Copy Call ID"
                          >
                            {copiedId === lead.call_id ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-600 text-xs italic">Awaiting call</span>
                      )}
                    </td>

                    {/* Action Buttons */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Button 1: Call Phone (PSTN) */}
                        <button
                          onClick={() => onCallPSTN(lead.id)}
                          disabled={isCallingThis}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-sm shadow-blue-500/20 border border-blue-400/20 transition active:scale-98 disabled:opacity-50"
                          title="Triggers real HTTP request to Vapi /call API for outbound phone call"
                        >
                          {isCallingThis ? (
                            <>
                              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                              <span>Dialing...</span>
                            </>
                          ) : (
                            <>
                              <PhoneOutgoing className="w-3.5 h-3.5" />
                              <span>Call Phone (PSTN)</span>
                            </>
                          )}
                        </button>

                        {/* Button 2: Live Browser Call (WebRTC) */}
                        <button
                          onClick={() => onStartWebRTC(lead)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white shadow-sm shadow-cyan-500/20 border border-cyan-400/20 transition active:scale-98"
                          title="Test voice agent immediately using browser microphone with WebRTC (No phone balance required)"
                        >
                          <Mic className="w-3.5 h-3.5 text-cyan-200" />
                          <span>Live Browser Call (WebRTC)</span>
                        </button>

                        {/* Reset Lead button (if failed or completed) */}
                        {(lead.call_status === 'Completed' || lead.call_status === 'Failed') && (
                          <button
                            onClick={() => onResetLead(lead.id)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 transition"
                            title="Reset lead back to Pending for re-testing"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
