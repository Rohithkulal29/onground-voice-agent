import React, { useState, useEffect, useRef } from 'react';
import Vapi from '@vapi-ai/web';
import { 
  Mic, 
  MicOff, 
  PhoneOff, 
  Volume2, 
  Sparkles, 
  Store, 
  User, 
  CheckCircle, 
  AlertTriangle,
  Play,
  RotateCw,
  MessageSquare
} from 'lucide-react';

export default function WebRTCCallModal({ 
  lead, 
  onClose, 
  onSaveTranscript,
  defaultPublicKey,
  defaultAssistantId 
}) {
  const [callStatus, setCallStatus] = useState('idle'); // idle, connecting, active, ended, error
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakerRole, setSpeakerRole] = useState(null); // 'user' | 'assistant'
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [transcriptMessages, setTranscriptMessages] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Credentials (allow local override if .env is unset)
  const [publicKey, setPublicKey] = useState(
    localStorage.getItem('vapi_public_key') || defaultPublicKey || ''
  );
  const [assistantId, setAssistantId] = useState(
    localStorage.getItem('vapi_assistant_id') || defaultAssistantId || ''
  );
  const [showConfig, setShowConfig] = useState(false);

  const vapiRef = useRef(null);
  const timerRef = useRef(null);
  const transcriptEndRef = useRef(null);
  const simulationRef = useRef(null);

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcriptMessages]);

  // Call duration timer
  useEffect(() => {
    if (callStatus === 'active') {
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callStatus]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (vapiRef.current) {
        try {
          vapiRef.current.stop();
        } catch (e) {
          // ignore
        }
      }
      if (simulationRef.current) {
        clearTimeout(simulationRef.current);
      }
    };
  }, []);

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startRealVapiCall = async () => {
    setErrorMessage('');
    const cleanKey = publicKey.trim();
    const cleanAssistant = assistantId.trim();

    if (!cleanKey || cleanKey.includes('your_')) {
      setShowConfig(true);
      setErrorMessage('Please enter a valid Vapi Public Key to start the real WebRTC call, or use the interactive demo simulator below.');
      return;
    }

    if (!cleanAssistant || cleanAssistant.includes('your_')) {
      setShowConfig(true);
      setErrorMessage('Please enter a valid Vapi Assistant ID to start the real WebRTC call.');
      return;
    }

    localStorage.setItem('vapi_public_key', cleanKey);
    localStorage.setItem('vapi_assistant_id', cleanAssistant);

    setCallStatus('connecting');
    setTranscriptMessages([]);
    setDuration(0);

    try {
      const vapi = new Vapi(cleanKey);
      vapiRef.current = vapi;

      vapi.on('call-start', () => {
        setCallStatus('active');
        setTranscriptMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            text: `Connected to On-Ground Voice Agent for ${lead.customer_name} (${lead.store_branch}).`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      });

      vapi.on('call-end', () => {
        handleCallTermination('completed');
      });

      vapi.on('speech-start', () => {
        setIsSpeaking(true);
      });

      vapi.on('speech-end', () => {
        setIsSpeaking(false);
      });

      vapi.on('volume-level', (vol) => {
        setVolumeLevel(vol);
      });

      vapi.on('message', (msg) => {
        if (msg.type === 'transcript') {
          const role = msg.role === 'user' ? 'user' : 'assistant';
          setSpeakerRole(role);
          if (msg.transcriptType === 'final' || msg.transcript) {
            setTranscriptMessages(prev => {
              // Update last or append
              const text = msg.transcript;
              if (!text) return prev;
              return [
                ...prev,
                {
                  role: role,
                  text: text,
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }
              ];
            });
          }
        }
      });

      vapi.on('error', (err) => {
        console.error('Vapi WebRTC Error:', err);
        setErrorMessage(err.message || 'Error occurred during WebRTC voice call.');
        setCallStatus('error');
      });

      // Start call per user instruction:
      // vapi.start(VITE_VAPI_ASSISTANT_ID, { variableValues: { customer_name, store_branch, campaign_offer } })
      await vapi.start(cleanAssistant, {
        variableValues: {
          customer_name: lead.customer_name,
          store_branch: lead.store_branch,
          campaign_offer: lead.campaign_offer
        }
      });

    } catch (err) {
      console.error('Failed to start Vapi call:', err);
      setErrorMessage(err.message || 'Failed to start WebRTC session. Check microphone permissions and keys.');
      setCallStatus('error');
    }
  };

  const startDemoSimulation = () => {
    setCallStatus('active');
    setTranscriptMessages([]);
    setDuration(0);
    setErrorMessage('');

    const script = [
      {
        role: 'assistant',
        text: `Hello ${lead.customer_name}! This is Maya from On-Ground Retail at our ${lead.store_branch}. I'm reaching out with an exclusive promotion: ${lead.campaign_offer}. Do you have a brief moment?`,
        delay: 1500
      },
      {
        role: 'user',
        text: `Yes Maya, tell me more. When is this valid until?`,
        delay: 5500
      },
      {
        role: 'assistant',
        text: `It's valid all throughout this week exclusively at our ${lead.store_branch}! You can also redeem an extra 500 reward points if you visit before 6 PM on weekdays. Can I reserve your VIP invite pass?`,
        delay: 10000
      },
      {
        role: 'user',
        text: `That sounds great, please send the pass to my number.`,
        delay: 15500
      },
      {
        role: 'assistant',
        text: `Confirmed, ${lead.customer_name}! Your VIP voucher code has been registered for ${lead.phone_number}. We look forward to seeing you at On-Ground ${lead.store_branch}! Have a wonderful day.`,
        delay: 20000
      }
    ];

    script.forEach((item) => {
      simulationRef.current = setTimeout(() => {
        setSpeakerRole(item.role);
        setIsSpeaking(true);
        setVolumeLevel(item.role === 'assistant' ? 0.6 : 0.4);

        setTranscriptMessages(prev => [
          ...prev,
          {
            role: item.role,
            text: item.text,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);

        setTimeout(() => {
          setIsSpeaking(false);
          setVolumeLevel(0);
        }, 2200);
      }, item.delay);
    });
  };

  const handleEndCall = () => {
    if (vapiRef.current) {
      try {
        vapiRef.current.stop();
      } catch (e) {
        // ignore
      }
    }
    if (simulationRef.current) {
      clearTimeout(simulationRef.current);
    }
    handleCallTermination('ended');
  };

  const handleCallTermination = async (finalStatus) => {
    setCallStatus(finalStatus);
    setIsSpeaking(false);
    setVolumeLevel(0);

    // Build consolidated transcript
    const fullTranscript = transcriptMessages
      .map(m => `${m.role === 'user' ? lead.customer_name : 'Maya (Store AI)'}: ${m.text}`)
      .join('\n\n');

    if (fullTranscript.trim()) {
      try {
        await onSaveTranscript(lead.id, fullTranscript, 'Completed');
      } catch (e) {
        console.warn('Could not auto-save transcript to backend:', e);
      }
    }
  };

  const toggleMute = () => {
    if (vapiRef.current) {
      const newMuteState = !isMuted;
      try {
        vapiRef.current.setMuted(newMuteState);
        setIsMuted(newMuteState);
      } catch (e) {
        setIsMuted(newMuteState);
      }
    } else {
      setIsMuted(!isMuted);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="glass-panel w-full max-w-2xl rounded-3xl border border-slate-700/80 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white shadow-md shadow-cyan-500/20">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Live WebRTC Voice Agent</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 uppercase tracking-wide">
                  Browser Mic
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Direct in-browser testing with zero telephone carrier latency
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {callStatus === 'active' && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>{formatDuration(duration)}</span>
              </div>
            )}
            <button
              onClick={callStatus === 'active' ? handleEndCall : onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Lead Context Bar */}
        <div className="px-6 py-3 bg-slate-900/40 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <User className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-semibold text-white">{lead.customer_name}</span>
            <span className="text-slate-500">|</span>
            <span className="font-mono text-slate-400">{lead.phone_number}</span>
          </div>

          <div className="flex items-center gap-2 text-slate-300">
            <Store className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-cyan-300 font-medium">{lead.store_branch}</span>
          </div>
        </div>

        {/* Promotional Offer Banner */}
        <div className="px-6 py-2.5 bg-indigo-950/20 border-b border-indigo-900/30 flex items-center gap-2 text-xs text-indigo-200">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span className="font-semibold text-indigo-300">Campaign:</span>
          <span className="truncate">{lead.campaign_offer}</span>
        </div>

        {/* Center Calling Stage & Microphone Pulsing Visualizer */}
        <div className="p-6 flex flex-col items-center justify-center relative overflow-hidden bg-gradient-to-b from-slate-900/50 to-slate-950/50">
          
          {/* Radial animated wave rings when active */}
          <div className="relative flex items-center justify-center my-4">
            {callStatus === 'active' && (
              <>
                <div 
                  className="absolute rounded-full bg-cyan-500/20 animate-ping"
                  style={{ 
                    width: `${90 + volumeLevel * 80}px`, 
                    height: `${90 + volumeLevel * 80}px`,
                    transition: 'all 0.1s ease-out'
                  }}
                />
                <div 
                  className="absolute rounded-full bg-indigo-500/20"
                  style={{ 
                    width: `${120 + volumeLevel * 100}px`, 
                    height: `${120 + volumeLevel * 100}px`,
                    transition: 'all 0.1s ease-out'
                  }}
                />
              </>
            )}

            {/* Main Microphone Action Sphere */}
            <div 
              className={`w-24 h-24 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 z-10 ${
                callStatus === 'active'
                  ? isSpeaking
                    ? 'bg-gradient-to-tr from-cyan-500 to-indigo-500 ring-4 ring-cyan-400/50 shadow-cyan-500/50 scale-105'
                    : 'bg-gradient-to-tr from-indigo-600 to-slate-800 ring-2 ring-indigo-500/30'
                  : callStatus === 'connecting'
                  ? 'bg-amber-600/80 animate-pulse ring-4 ring-amber-400/30'
                  : callStatus === 'ended'
                  ? 'bg-slate-800 ring-2 ring-emerald-500/30'
                  : 'bg-gradient-to-tr from-indigo-600 to-cyan-600 hover:scale-105 cursor-pointer shadow-indigo-600/30 ring-4 ring-white/10'
              }`}
              onClick={callStatus === 'idle' ? startRealVapiCall : undefined}
            >
              {isMuted ? (
                <MicOff className="w-10 h-10 text-rose-300" />
              ) : callStatus === 'connecting' ? (
                <RotateCw className="w-10 h-10 text-amber-200 animate-spin" />
              ) : callStatus === 'ended' ? (
                <CheckCircle className="w-10 h-10 text-emerald-400" />
              ) : (
                <Mic className="w-10 h-10 text-white" />
              )}
            </div>
          </div>

          {/* Sound wave visualizer bars */}
          {callStatus === 'active' && (
            <div className="flex items-center gap-1.5 h-9 mb-2">
              <div className="w-1 bg-cyan-400 rounded-full sound-bar"></div>
              <div className="w-1 bg-indigo-400 rounded-full sound-bar"></div>
              <div className="w-1 bg-cyan-300 rounded-full sound-bar"></div>
              <div className="w-1 bg-indigo-300 rounded-full sound-bar"></div>
              <div className="w-1 bg-cyan-400 rounded-full sound-bar"></div>
            </div>
          )}

          {/* Status Label */}
          <div className="text-center mt-2">
            <h4 className="text-sm font-semibold text-white">
              {callStatus === 'idle' && 'Ready to Connect WebRTC Voice'}
              {callStatus === 'connecting' && 'Establishing Secure WebRTC Session...'}
              {callStatus === 'active' && (
                isSpeaking 
                  ? `${speakerRole === 'user' ? 'Listening to Customer (' + lead.customer_name + ')' : 'Maya (Store AI) is speaking...'}`
                  : 'Call Active — Speak directly into your microphone'
              )}
              {callStatus === 'ended' && 'Call Concluded & Transcript Saved'}
              {callStatus === 'error' && 'Session Interrupted'}
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              {callStatus === 'idle' && 'Click below to launch real Vapi WebRTC or test using live simulator'}
              {callStatus === 'active' && 'Natural full-duplex conversational voice AI'}
              {callStatus === 'ended' && 'Lead status updated to Completed with conversation transcript'}
            </p>
          </div>

          {/* Error banner if any */}
          {errorMessage && (
            <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs text-center max-w-md">
              <div className="flex items-center justify-center gap-1.5 font-semibold mb-1">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>Notice</span>
              </div>
              <p>{errorMessage}</p>
            </div>
          )}

          {/* Quick interactive keys configuration dropdown if needed */}
          {showConfig && callStatus !== 'active' && (
            <div className="mt-4 p-4 rounded-2xl bg-slate-900 border border-slate-700/80 w-full max-w-lg text-xs space-y-3">
              <div className="flex items-center justify-between text-slate-300 font-semibold">
                <span>Vapi Web Credentials</span>
                <button 
                  onClick={() => setShowConfig(false)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Vapi Public Key</label>
                <input
                  type="text"
                  placeholder="e.g. 4d742... (from Vapi Org Settings -> API Keys)"
                  value={publicKey}
                  onChange={(e) => setPublicKey(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Vapi Assistant ID</label>
                <input
                  type="text"
                  placeholder="e.g. 81a7b... (from Vapi Assistants tab)"
                  value={assistantId}
                  onChange={(e) => setAssistantId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono"
                />
              </div>
            </div>
          )}
        </div>

        {/* Live Real-time Transcript Feed */}
        <div className="flex-1 px-6 py-4 overflow-y-auto max-h-60 border-t border-b border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
              Live Transcript Feed
            </span>
            <span className="text-[11px] text-slate-400">
              {transcriptMessages.length} {transcriptMessages.length === 1 ? 'Turn' : 'Turns'}
            </span>
          </div>

          {transcriptMessages.length === 0 ? (
            <div className="py-8 text-center text-slate-600 text-xs italic">
              Dialogue transcripts will stream here in real-time as words are spoken.
            </div>
          ) : (
            <div className="space-y-3">
              {transcriptMessages.map((msg, idx) => {
                const isAI = msg.role === 'assistant';
                return (
                  <div
                    key={idx}
                    className={`flex flex-col ${isAI ? 'items-start' : 'items-end'}`}
                  >
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-1 px-1">
                      <span className="font-semibold text-slate-300">
                        {isAI ? 'Maya (Store AI)' : lead.customer_name}
                      </span>
                      <span>•</span>
                      <span>{msg.timestamp}</span>
                    </div>
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                        isAI
                          ? 'bg-slate-800/90 text-slate-100 rounded-tl-sm border border-slate-700/60'
                          : 'bg-indigo-600 text-white rounded-tr-sm shadow-md shadow-indigo-600/20'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                );
              })}
              <div ref={transcriptEndRef} />
            </div>
          )}
        </div>

        {/* Bottom Call Controls */}
        <div className="px-6 py-4 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {callStatus === 'active' && (
              <button
                onClick={toggleMute}
                className={`p-2.5 rounded-xl border transition ${
                  isMuted
                    ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
                title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
              >
                {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            )}

            {callStatus === 'idle' && (
              <button
                onClick={() => setShowConfig(!showConfig)}
                className="text-xs text-indigo-400 hover:text-indigo-300 underline font-medium"
              >
                {showConfig ? 'Hide Config' : 'Configure Vapi Web Keys'}
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {callStatus === 'idle' ? (
              <>
                {/* Simulated Demo Option */}
                <button
                  onClick={startDemoSimulation}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                >
                  <Play className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Interactive Voice Demo</span>
                </button>

                {/* Real WebRTC Call button */}
                <button
                  onClick={startRealVapiCall}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-white shadow-lg shadow-cyan-500/20 transition transform active:scale-98"
                >
                  <Mic className="w-4 h-4" />
                  <span>Start Live WebRTC Call</span>
                </button>
              </>
            ) : callStatus === 'active' ? (
              <button
                onClick={handleEndCall}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-lg shadow-rose-600/30 transition transform active:scale-98"
              >
                <PhoneOff className="w-4 h-4" />
                <span>End Call</span>
              </button>
            ) : (
              <button
                onClick={onClose}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition"
              >
                <span>Close & Return to Queue</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
