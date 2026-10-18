import os
import httpx
from typing import Dict, Any, Tuple
from dotenv import load_dotenv

load_dotenv()

VAPI_API_URL = "https://api.vapi.ai/call"

def get_vapi_config():
    return {
        "private_key": os.getenv("VAPI_PRIVATE_KEY", "").strip(),
        "phone_number_id": os.getenv("VAPI_PHONE_NUMBER_ID", "").strip(),
        "assistant_id": os.getenv("VAPI_ASSISTANT_ID", "").strip(),
    }

async def trigger_outbound_call(lead: Dict[str, Any]) -> Tuple[bool, str, Dict[str, Any]]:
    """
    Sends outbound call request to Vapi API.
    Returns (success: bool, call_id_or_error_msg: str, raw_response: dict)
    """
    config = get_vapi_config()
    private_key = config["private_key"]
    phone_number_id = config["phone_number_id"]
    assistant_id = config["assistant_id"]

    if not private_key or "your_" in private_key:
        return (
            False,
            "Vapi Private Key is missing or default placeholder. Please configure VAPI_PRIVATE_KEY in backend/.env to trigger real PSTN calls.",
            {"error": "MISSING_VAPI_PRIVATE_KEY"}
        )

    if not phone_number_id or "your_" in phone_number_id:
        return (
            False,
            "Vapi Phone Number ID is missing or default placeholder. Please configure VAPI_PHONE_NUMBER_ID in backend/.env.",
            {"error": "MISSING_VAPI_PHONE_NUMBER_ID"}
        )

    if not assistant_id or "your_" in assistant_id:
        return (
            False,
            "Vapi Assistant ID is missing or default placeholder. Please configure VAPI_ASSISTANT_ID in backend/.env.",
            {"error": "MISSING_VAPI_ASSISTANT_ID"}
        )

    # Normalize phone number
    raw_phone = str(lead.get("phone_number", "")).strip().replace(" ", "").replace("-", "")
    if not raw_phone.startswith("+"):
        raw_phone = f"+{raw_phone}"

    customer_name = lead.get("customer_name", "Valued Customer")
    store_branch = lead.get("store_branch", "our flagship retail store")
    campaign_offer = lead.get("campaign_offer", "an exclusive store promotion")

    first_message = (
        f"Hello {customer_name}! This is Maya calling from On-Ground Retail at our {store_branch}. "
        f"I'm reaching out with an exclusive promotion: {campaign_offer}. Do you have a brief moment?"
    )

    system_prompt = (
        f"You are Maya, an energetic, friendly, and professional voice AI marketing specialist for On-Ground Retail at {store_branch}. "
        f"You are speaking with {customer_name}. The promotional campaign is: '{campaign_offer}'. "
        f"Key guidelines:\n"
        f"1. Explain the offer clearly and concisely.\n"
        f"2. Mention the offer is valid this week at the {store_branch} branch.\n"
        f"3. Answer any questions regarding store hours (10 AM to 9:30 PM), location, or offer redemption.\n"
        f"4. Warmly invite {customer_name} to visit or confirm if they'd like an SMS voucher sent.\n"
        f"5. Keep responses concise, warm, and natural for voice conversation."
    )

    payload = {
        "phoneNumberId": phone_number_id,
        "assistantId": assistant_id,
        "customer": {
            "number": raw_phone,
            "name": customer_name
        },
        "assistantOverrides": {
            "firstMessage": first_message,
            "variableValues": {
                "customer_name": customer_name,
                "store_branch": store_branch,
                "campaign_offer": campaign_offer
            },
            "model": {
                "messages": [
                    {
                        "role": "system",
                        "content": system_prompt
                    }
                ]
            }
        }
    }

    headers = {
        "Authorization": f"Bearer {private_key}",
        "Content-Type": "application/json"
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(VAPI_API_URL, json=payload, headers=headers)
            data = response.json() if response.content else {}

            if response.status_code in (200, 201):
                call_id = data.get("id") or data.get("callId") or f"call_{data.get('createdAt', '')}"
                return True, str(call_id), data
            else:
                error_msg = (
                    data.get("message")
                    or data.get("error")
                    or f"Vapi API returned HTTP {response.status_code}: {response.text}"
                )
                return False, str(error_msg), data
    except httpx.RequestError as exc:
        return False, f"Network request error contacting Vapi API: {str(exc)}", {"exception": str(exc)}
    except Exception as exc:
        return False, f"Unexpected error during Vapi call dispatch: {str(exc)}", {"exception": str(exc)}
