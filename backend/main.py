import os
import json
import logging
from contextlib import asynccontextmanager
from typing import Dict, Any, List

from fastapi import FastAPI, HTTPException, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from database import (
    init_db,
    get_all_leads,
    get_lead_by_id,
    create_lead,
    update_lead_status,
    update_lead_by_call_id
)
from models import LeadCreate, LeadResponse, OutboundCallRequest, SaveTranscriptRequest
from vapi_client import trigger_outbound_call, get_vapi_config

# Setup logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("onground-voice-agent")

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing SQLite database and pre-seeding sample retail leads...")
    init_db()
    logger.info("Database initialized successfully.")
    yield

app = FastAPI(
    title="On-Ground.ai Voice Agent Backend",
    description="Agentic Retail Store Marketing Voice OS - Backend API",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware for *
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {
        "system": "On-Ground.ai — Agentic Retail Store Marketing Voice OS",
        "status": "healthy",
        "docs_url": "/docs"
    }

@app.get("/api/health")
def health_check():
    cfg = get_vapi_config()
    return {
        "status": "ok",
        "vapi_configured": {
            "has_private_key": bool(cfg["private_key"] and "your_" not in cfg["private_key"]),
            "has_phone_number_id": bool(cfg["phone_number_id"] and "your_" not in cfg["phone_number_id"]),
            "has_assistant_id": bool(cfg["assistant_id"] and "your_" not in cfg["assistant_id"]),
        }
    }

@app.get("/api/leads", response_model=List[LeadResponse])
def list_leads():
    """List all retail campaign leads."""
    return get_all_leads()

@app.post("/api/leads", response_model=LeadResponse, status_code=status.HTTP_201_CREATED)
def add_lead(lead_in: LeadCreate):
    """Add a new retail campaign lead."""
    created = create_lead(
        customer_name=lead_in.customer_name,
        phone_number=lead_in.phone_number,
        store_branch=lead_in.store_branch,
        campaign_offer=lead_in.campaign_offer
    )
    return created

@app.post("/api/calls/outbound")
async def start_outbound_call(payload: OutboundCallRequest):
    """
    Triggers a real Vapi outbound PSTN phone call to the customer for the given lead.
    Updates SQLite lead status to 'Calling' and saves the returned call_id.
    """
    lead = get_lead_by_id(payload.lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail=f"Lead with id {payload.lead_id} not found.")

    logger.info(f"Initiating outbound PSTN call for Lead #{lead['id']} ({lead['customer_name']} -> {lead['phone_number']})")

    success, result_or_error, raw_response = await trigger_outbound_call(lead)

    if not success:
        logger.error(f"Failed to initiate call for Lead #{lead['id']}: {result_or_error}")
        update_lead_status(lead["id"], call_status="Failed")
        raise HTTPException(
            status_code=400,
            detail={
                "message": result_or_error,
                "lead_id": lead["id"],
                "raw_response": raw_response
            }
        )

    call_id = result_or_error
    updated_lead = update_lead_status(lead["id"], call_status="Calling", call_id=call_id)
    logger.info(f"Outbound call successfully queued with Vapi. Call ID: {call_id}")

    return {
        "success": True,
        "message": f"Outbound call dispatched successfully to {lead['customer_name']} ({lead['phone_number']}).",
        "call_id": call_id,
        "lead": updated_lead,
        "vapi_response": raw_response
    }

@app.post("/api/webhooks/vapi")
async def vapi_webhook(request: Request):
    """
    Receives webhook events from Vapi (e.g. status-update, end-of-call-report)
    and updates SQLite lead call_status and transcript.
    """
    try:
        body = await request.json()
    except Exception:
        body = {}

    logger.info(f"Vapi webhook payload received: {json.dumps(body, indent=2)}")

    message = body.get("message", body)
    msg_type = message.get("type", "")
    call_obj = message.get("call") or body.get("call") or {}
    call_id = call_obj.get("id") or message.get("callId") or body.get("callId")

    if not call_id:
        logger.warning("Vapi webhook missing call id, acknowledging 200 OK.")
        return {"status": "ignored", "reason": "no call_id found in payload"}

    if msg_type == "status-update":
        raw_status = message.get("status", "")
        status_map = {
            "queued": "Calling",
            "ringing": "Calling",
            "in-progress": "In-Progress",
            "forwarding": "In-Progress",
            "ended": "Completed",
            "failed": "Failed",
            "no-answer": "Failed",
            "busy": "Failed"
        }
        mapped_status = status_map.get(raw_status.lower(), "In-Progress")
        update_lead_by_call_id(call_id, call_status=mapped_status)
        logger.info(f"Updated lead call_id={call_id} to status={mapped_status} from status-update={raw_status}")

    elif msg_type == "end-of-call-report":
        # Clean transcript processing to extract structured conversation turns
        transcript_raw = message.get("transcript")
        if not transcript_raw and "artifact" in message:
            transcript_raw = message["artifact"].get("transcript")
            
        if isinstance(transcript_raw, list):
            clean_lines = []
            seen = set()
            for turn in transcript_raw:
                role = turn.get("role", "")
                text = turn.get("message") or turn.get("content", "")
                if text:
                    speaker = "Maya (Store AI)" if role in ["assistant", "bot"] else "rohith"
                    line = f"{speaker}: {text.strip()}"
                    if line not in seen:
                        seen.add(line)
                        clean_lines.append(line)
            transcript = "\n".join(clean_lines) if clean_lines else "Call completed (No transcript returned)."
        else:
            transcript = transcript_raw or message.get("summary") or "Call completed (No transcript returned)."

        ended_reason = message.get("endedReason", "")
        status_to_set = "Completed"
        if "fail" in ended_reason.lower() or "error" in ended_reason.lower():
            status_to_set = "Failed"

        update_lead_by_call_id(call_id, call_status=status_to_set, transcript=transcript)
        logger.info(f"Updated lead call_id={call_id} from end-of-call-report: status={status_to_set}")

    elif msg_type == "transcript":
        transcript_text = message.get("transcript", "")
        if transcript_text:
            update_lead_by_call_id(call_id, transcript=transcript_text)

    return {"status": "ok", "message_type": msg_type, "call_id": call_id}

@app.post("/api/calls/save-transcript")
def save_transcript(payload: SaveTranscriptRequest):
    """
    Saves transcript and status for WebRTC in-browser calls or manual transcript syncing.
    """
    if payload.lead_id:
        lead = get_lead_by_id(payload.lead_id)
        if not lead:
            raise HTTPException(status_code=404, detail="Lead not found.")
        updated = update_lead_status(
            lead_id=payload.lead_id,
            call_status=payload.call_status or "Completed",
            call_id=payload.call_id or lead.get("call_id"),
            transcript=payload.transcript
        )
        return {"success": True, "lead": updated}
    elif payload.call_id:
        updated = update_lead_by_call_id(
            call_id=payload.call_id,
            call_status=payload.call_status or "Completed",
            transcript=payload.transcript
        )
        return {"success": True, "lead": updated}
    else:
        raise HTTPException(status_code=400, detail="Either lead_id or call_id must be provided.")

@app.post("/api/leads/{lead_id}/reset")
def reset_lead_status(lead_id: int):
    """Convenience endpoint to reset a lead's status to 'Pending' for testing."""
    lead = get_lead_by_id(lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found.")
    updated = update_lead_status(lead_id, call_status="Pending", call_id="", transcript="")
    return {"success": True, "lead": updated}