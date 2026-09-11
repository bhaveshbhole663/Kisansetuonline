from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class FarmerRegisterRequest(BaseModel):
    name: str
    mobile: str
    village: Optional[str] = "Hadapsar"
    district: Optional[str] = "Pune"
    preferred_language: Optional[str] = "hi"

class LoginRequest(BaseModel):
    phone: str
    role: Optional[str] = "FARMER"
    pin: Optional[str] = None

class BookingCreateRequest(BaseModel):
    farmer_id: Optional[int] = None
    farmer_name: Optional[str] = None
    farmer_mobile: Optional[str] = None
    farmer_village: Optional[str] = None
    centre_id: int
    slot_id: int
    crop: str
    quantity: Optional[float] = 40.0
    booking_channel: Optional[str] = "WEB"  # WEB, SMS, IVR, WALK_IN

class ProcurementStatusUpdateRequest(BaseModel):
    booking_id: int
    new_status: str  # ARRIVED, QUALITY_CHECK, WEIGHED, ACCEPTED, REJECTED, PAYMENT_PROCESSING, PAID
    quality_result: Optional[str] = None  # GRADE_A, GRADE_B, ACCEPTED, REJECTED
    quality_notes: Optional[str] = None
    quantity: Optional[float] = None
    payment_amount: Optional[float] = None
    remarks: Optional[str] = None
    changed_by: Optional[str] = "CENTRE_STAFF"

class PaymentStatusUpdateRequest(BaseModel):
    procurement_id: int
    payment_status: str  # PROCESSING, PAID, FAILED
    transaction_reference: Optional[str] = None
    amount: Optional[float] = None

class WalkInRegisterRequest(BaseModel):
    name: str
    mobile: str
    centre_id: int
    crop: str
    estimated_quantity: float
    village: Optional[str] = "Local"
    district: Optional[str] = "Pune"

class SMSWebhookRequest(BaseModel):
    from_phone: str
    message: str

class IVRWebhookRequest(BaseModel):
    caller_phone: str
    step: str = "INIT"  # INIT, LANG_SELECTED, MENU_SELECTED, CENTRE_SELECTED, DATE_SELECTED, SLOT_SELECTED
    input_digits: Optional[str] = None
    language: Optional[str] = "hi"
    centre_id: Optional[int] = None
    slot_id: Optional[int] = None
    crop: Optional[str] = "Wheat"

class AIQueryRequest(BaseModel):
    query_text: str
    farmer_id: Optional[int] = None
    phone: Optional[str] = None
    language: Optional[str] = "hi"
