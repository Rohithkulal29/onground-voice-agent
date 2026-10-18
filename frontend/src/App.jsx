import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import StatsCards from './components/StatsCards';
import LeadForm from './components/LeadForm';
import LeadsTable from './components/LeadsTable';
import WebRTCCallModal from './components/WebRTCCallModal';
import TranscriptModal from './components/TranscriptModal';
import SettingsModal from './components/SettingsModal';
import { 
  fetchLeads, 
  createLead, 
  callLeadPSTN, 
  saveWebRTCTranscript, 
  resetLead, 
  checkBackendHealth 
} from './services/api';
import { AlertTriangle, CheckCircle, Info, Sparkles } from 'lucide-react';

export default function App() {
  const [leads, setLeads] = useState([]);
  const [isLoadingLeads, setIsLoadingLeads] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [backendHealth, setBackendHealth] = useState({ online: false });
  const [callingLeadId, setCallingLeadId] = useState(null);
  
  // Modals state
  const [activeWebRTCLead, setActiveWebRTCLead] = useState(null);
  const [selectedTranscriptLead, setSelectedTranscriptLead] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Notifications
  const [notification, setNotification] = useState(null);

  const defaultPublicKey = import.meta.env.VITE_VAPI_PUBLIC_KEY || '';
  const defaultAssistantId = import.meta.env.VITE_VAPI_ASSISTANT_ID || '';

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(prev => (prev?.message === message ? null : prev));
    }, 6000);
  };

  const loadLeads = useCallback(async (quiet = false) => {
    if (!quiet) setIsRefreshing(true);
    try {
      const data = await fetchLeads();
      setLeads(data);
    } catch (err) {
      console.error('Failed to load leads:', err);
      if (!quiet) {
        showNotification('error', `Could not fetch leads: ${err.message}`);
      }
    } finally {
      setIsLoadingLeads(false);
      setIsRefreshing(false);
    }
  }, []);

  const verifyHealth = useCallback(async () => {
    const health = await checkBackendHealth();
    setBackendHealth(health);
  }, []);

  useEffect(() => {
    verifyHealth();
    loadLeads();

    // Auto-refresh periodically to pick up webhook updates
    const interval = setInterval(() => {
      loadLeads(true);
      verifyHealth();
    }, 5000);

    return () => clearInterval(interval);
  }, [loadLeads, verifyHealth]);

  const handleLeadAdded = async (leadData) => {
    const newLead = await createLead(leadData);
    setLeads(prev => [newLead, ...prev]);
    showNotification('success', `Campaign lead for ${newLead.customer_name} created successfully.`);
  };

  const handleCallPSTN = async (leadId) => {
    setCallingLeadId(leadId);
    try {
      const result = await callLeadPSTN(leadId);
      showNotification('success', result.message || 'Outbound call dispatched successfully via Vapi API!');
      // Update local state immediately
      setLeads(prev => prev.map(l => {
        if (l.id === leadId) {
          return {
            ...l,
            call_status: 'Calling',
            call_id: result.call_id || l.call_id
          };
        }
        return l;
      }));
    } catch (err) {
      console.error('Call failed:', err);
      showNotification('error', err.message || 'Outbound call failed. Check Vapi credentials.');
      // Refresh to get updated status (e.g. Failed)
      loadLeads(true);
    } finally {
      setCallingLeadId(null);
    }
  };

  const handleStartWebRTC = (lead) => {
    setActiveWebRTCLead(lead);
  };

  const handleSaveWebRTCTranscript = async (leadId, transcript, callStatus = 'Completed') => {
    try {
      const result = await saveWebRTCTranscript({
        leadId,
        transcript,
        callStatus
      });
      if (result.lead) {
        setLeads(prev => prev.map(l => (l.id === leadId ? result.lead : l)));
      }
      showNotification('success', `Call completed. Transcript saved to Lead #${leadId}!`);
    } catch (err) {
      console.error('Failed to save WebRTC transcript:', err);
      showNotification('error', `Failed to save transcript: ${err.message}`);
    }
  };

  const handleResetLead = async (leadId) => {
    try {
      const result = await resetLead(leadId);
      if (result.lead) {
        setLeads(prev => prev.map(l => (l.id === leadId ? result.lead : l)));
      }
      showNotification('info', `Lead #${leadId} status reset to Pending.`);
    } catch (err) {
      showNotification('error', `Failed to reset lead: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        backendHealth={backendHealth}
        onRefresh={() => loadLeads()}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isRefreshing={isRefreshing}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Banner Notification Toast */}
        {notification && (
          <div className={`mb-6 p-4 rounded-2xl border flex items-center justify-between text-xs shadow-xl transition-all ${
            notification.type === 'error'
              ? 'bg-rose-950/80 border-rose-500/40 text-rose-200'
              : notification.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-200'
              : 'bg-indigo-950/80 border-indigo-500/40 text-indigo-200'
          }`}>
            <div className="flex items-center gap-2.5">
              {notification.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />}
              {notification.type === 'success' && <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />}
              {notification.type === 'info' && <Info className="w-4 h-4 text-indigo-400 shrink-0" />}
              <span className="font-medium">{notification.message}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-slate-400 hover:text-white ml-3 text-sm font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Hero Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 mb-3">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Next-Gen Retail Marketing Automation</span>
              </div>
              <h2 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
                On-Ground Store Campaign Dispatcher
              </h2>
              <p className="mt-2 text-sm text-slate-400 max-w-2xl leading-relaxed">
                Connect directly with retail shoppers via hyper-personalized AI outbound voice calls and instant in-browser WebRTC testing. Drive walk-in conversions with localized promotional offers.
              </p>
            </div>
          </div>
        </div>

        {/* Analytics Stats Cards */}
        <StatsCards leads={leads} />

        {/* Add Campaign Lead Form Card */}
        <LeadForm onLeadAdded={handleLeadAdded} />

        {/* Outbound Leads Queue Table */}
        <LeadsTable
          leads={leads}
          onCallPSTN={handleCallPSTN}
          onStartWebRTC={handleStartWebRTC}
          onViewTranscript={(lead) => setSelectedTranscriptLead(lead)}
          onResetLead={handleResetLead}
          callingLeadId={callingLeadId}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500 bg-slate-950/60">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>On-Ground.ai — Agentic Store Marketing Voice OS</span>
          <span>FastAPI + SQLite + Vapi Outbound PSTN + WebRTC Voice</span>
        </div>
      </footer>

      {/* Modals */}
      {activeWebRTCLead && (
        <WebRTCCallModal
          lead={activeWebRTCLead}
          onClose={() => setActiveWebRTCLead(null)}
          onSaveTranscript={handleSaveWebRTCTranscript}
          defaultPublicKey={defaultPublicKey}
          defaultAssistantId={defaultAssistantId}
        />
      )}

      {selectedTranscriptLead && (
        <TranscriptModal
          lead={selectedTranscriptLead}
          onClose={() => setSelectedTranscriptLead(null)}
        />
      )}

      {isSettingsOpen && (
        <SettingsModal
          onClose={() => setIsSettingsOpen(false)}
          defaultPublicKey={defaultPublicKey}
          defaultAssistantId={defaultAssistantId}
          onKeysUpdated={({ publicKey, assistantId }) => {
            showNotification('success', 'Vapi Web credentials updated.');
          }}
        />
      )}
    </div>
  );
}
