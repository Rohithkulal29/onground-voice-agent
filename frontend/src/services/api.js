const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export async function fetchLeads() {
  const res = await fetch(`${BASE_URL}/leads`);
  if (!res.ok) {
    throw new Error(`Failed to fetch leads: ${res.statusText}`);
  }
  return await res.json();
}

export async function createLead(leadData) {
  const res = await fetch(`${BASE_URL}/leads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(leadData)
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to create lead (${res.status})`);
  }
  return await res.json();
}

export async function callLeadPSTN(leadId) {
  const res = await fetch(`${BASE_URL}/calls/outbound`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lead_id: leadId })
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errMsg = data.detail?.message || data.detail || `Outbound call failed (${res.status})`;
    throw new Error(errMsg);
  }
  return data;
}

export async function saveWebRTCTranscript({ leadId, callId, transcript, callStatus = 'Completed' }) {
  const res = await fetch(`${BASE_URL}/calls/save-transcript`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      lead_id: leadId,
      call_id: callId,
      transcript: transcript,
      call_status: callStatus
    })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to save transcript');
  }
  return await res.json();
}

export async function resetLead(leadId) {
  const res = await fetch(`${BASE_URL}/leads/${leadId}/reset`, {
    method: 'POST'
  });
  if (!res.ok) {
    throw new Error(`Failed to reset lead ${leadId}`);
  }
  return await res.json();
}

export async function checkBackendHealth() {
  try {
    const res = await fetch(`${BASE_URL}/health`);
    if (!res.ok) return { online: false };
    const data = await res.json();
    return { online: true, ...data };
  } catch (err) {
    return { online: false, error: err.message };
  }
}
