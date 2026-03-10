from pydantic import BaseModel, ConfigDict
from datetime import date
from typing import Optional

# -------------------------------------------------------------------
# Incoming Requests (Matches Java Spring Boot Entities)
# -------------------------------------------------------------------

class ClaimPredictionRequest(BaseModel):
    # System Information
    emrSystem: str
    billingSystem: str
    
    # Financials
    medicineCost: float
    procedureCost: float
    roomCharges: float
    totalBillAmount: float
    
    # Insurance Payments
    expectedInsurancePayment: float
    patientPayableAmount: float

    # Categorical Features mapping to DB Enums
    departmentType: str
    
    # Entity Relationships
    age: int # From Patient Entity
    sex: str # From Patient Entity
    insuranceProvider: str # From Insurance Entity
    insuranceType: str # From Insurance Entity
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "emrSystem": "Practo_EMR",
                "billingSystem": "Oracle_Health",
                "departmentType": "Cardiology",
                "medicineCost": 15000.0,
                "procedureCost": 120000.0,
                "roomCharges": 25000.0,
                "totalBillAmount": 160000.0,
                "expectedInsurancePayment": 140000.0,
                "patientPayableAmount": 20000.0,
                "age": 45,
                "sex": "M",
                "insuranceProvider": "Star Health",
                "insuranceType": "Private"
            }
        }
    )

# -------------------------------------------------------------------
# Outgoing Responses
# -------------------------------------------------------------------

class NextBestAction(BaseModel):
    action_type: str
    recommended_department: str
    instruction: str

class PaymentTimeline(BaseModel):
    estimated_days_to_pay: int
    expected_date: str

class FinancialVarianceWarning(BaseModel):
    alert_level: str
    expected_payment: float
    historical_avg_payment: float
    message: str

class ClaimPredictionResponse(BaseModel):
    is_approved: bool
    approval_confidence: float
    denial_risk: float
    predicted_denial_reason: Optional[str] = None
    action_required: str
    
    # Advanced Prescriptive AI Features
    top_risk_factors: list[str]
    next_best_action: Optional[NextBestAction] = None
    expected_payment_timeline: Optional[PaymentTimeline] = None
    financial_variance_warning: Optional[FinancialVarianceWarning] = None

class AppealGenerationRequest(BaseModel):
    patientName: str
    age: int
    insuranceProvider: str
    denialReason: str
    medicineCost: float
    procedureCost: float
    roomCharges: float
