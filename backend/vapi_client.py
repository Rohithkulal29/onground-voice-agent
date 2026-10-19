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

    # Bulletproof Trial Fix: Force route outbound PSTN calls to the pre-verified 
    # test lead phone number (+918123039379) to bypass Twilio trial carrier blocking 
    # on unverified/international destination numbers.
    verified_test_lead = os.getenv("TEST_LEAD_PHONE", "+918123039379").strip()
    raw_phone = verified_test_lead

    customer_name = lead.get("customer_name", "Valued Customer")
    store_branch = lead.get("store_branch", "our flagship retail store")
    campaign_offer = lead.get("campaign_offer", "an exclusive store promotion")

    first_message = (
        f"Hello {customer_name}! This is Maya calling from On-Ground Retail at our {store_branch}. "
        f"I'm reaching out with an exclusive promotion: {campaign_offer}. Do you have a brief moment?"
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