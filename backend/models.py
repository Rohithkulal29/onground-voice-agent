from pydantic import BaseModel, Field
from typing import Optional

class LeadCreate(BaseModel):
    customer_name: str = Field(..., min_length=1, description="Customer full name")
    phone_number: str = Field(..., min_length=5, description="Phone number in E.164 (+91...) format")
    store_branch: str = Field(..., min_length=1, description="Retail store branch name")
    campaign_offer: str = Field(..., min_length=1, description="Promotional campaign offer details")

class LeadResponse(BaseModel):
    id: int
    customer_name: str
    phone_number: str
    store_branch: str
    campaign_offer: str
    call_status: str
    call_id: Optional[str] = None
    transcript: Optional[str] = None
    created_at: str

class OutboundCallRequest(BaseModel):
    lead_id: int

class SaveTranscriptRequest(BaseModel):
    lead_id: Optional[int] = None
    call_id: Optional[str] = None
    transcript: str
    call_status: Optional[str] = "Completed"
