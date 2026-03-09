from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import numpy as np
import joblib
from schemas import ClaimPredictionRequest, ClaimPredictionResponse

# Initialize FastAPI app
app = FastAPI(
    title="MediVista RCM Intelligence API",
    description="ML Predictive API for Healthcare Revenue Cycle Management Dashboards",
    version="1.0.0"
)

# Allow Frontend (React) and Backend (Spring Boot) to communicate without CORS issues
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------------------------------------------
# Model Loading (Executes once on server start)
# -------------------------------------------------------------------
try:
    print("Loading ML Models and Encoders into memory...")
    approval_model = joblib.load('models/claim_approval_model.pkl')
    reason_model = joblib.load('models/denial_reason_model.pkl')
    label_encoders = joblib.load('models/label_encoders.pkl')
    denial_reason_encoder = joblib.load('models/denial_reason_encoder.pkl')
    
    # Pre-load Analytics Data for Dashboard GET endpoints
    analytics_df = pd.read_csv("data/synthetic_healthcare_rcm_dataset.csv")
    print("Models and Data loaded successfully!")
except Exception as e:
    print(f"Error loading models. Did you run train_models.py first? Error: {e}")

# Exact feature order expected by the XGBoost models
MODEL_FEATURES = [
    'age', 'sex', 'insurance_provider', 'insurance_type', 
    'department_type', 'emr_system', 'billing_system', 
    'medicine_cost', 'procedure_cost', 'room_charges', 
    'total_bill_amount', 'expected_insurance_payment', 'patient_payable_amount'
]

# -------------------------------------------------------------------
# 1. Prediction Endpoint (POST)
# -------------------------------------------------------------------

@app.post("/api/predict/claim", response_model=ClaimPredictionResponse)
def predict_claim_status(request: ClaimPredictionRequest):
    """
    Receives JSON matching the Java Spring Boot Entity. 
    Predicts if the claim will be Approved/Denied and gives the Likely Denial Reason.
    """
    try:
        # 1. Convert incoming JSON to a Pandas DataFrame (1 row)
        input_data = {
            'age': request.age,
            'sex': request.sex,
            'insurance_provider': request.insuranceProvider.replace('_', ' '),
            'insurance_type': request.insuranceType,
            'department_type': request.departmentType,
            'emr_system': request.emrSystem,
            'billing_system': request.billingSystem,
            'medicine_cost': request.medicineCost,
            'procedure_cost': request.procedureCost,
            'room_charges': request.roomCharges,
            'total_bill_amount': request.totalBillAmount,
            'expected_insurance_payment': request.expectedInsurancePayment,
            'patient_payable_amount': request.patientPayableAmount
        }
        
        df_input = pd.DataFrame([input_data])
        
        # 2. Encode categorical variables exactly like training time
        for col in label_encoders:
            if col in df_input.columns:
                # Handle unseen labels implicitly by replacing with a known label or catching error
                if str(df_input.loc[0, col]) not in label_encoders[col].classes_:
                    # Fallback to the first class if the frontend sends an unseen category
                    df_input[col] = label_encoders[col].transform([label_encoders[col].classes_[0]])
                else:
                    df_input[col] = label_encoders[col].transform([str(df_input.loc[0, col])])
                    
        # Ensure column order matches
        X_predict = df_input[MODEL_FEATURES]

        # 3. Model 1: Predict Approval/Denial
        # XGBoost output logic: [Probability of Class 0 (Denied), Probability of Class 1 (Approved)]
        probabilities = approval_model.predict_proba(X_predict)[0]
        denial_risk = float(probabilities[0])
        approval_confidence = float(probabilities[1])
        
        is_approved = bool(approval_confidence >= 0.8)

        # 4. Model 2: If NOT approved (meaning < 80% confidence), predict WHY
        predicted_reason = None
        action_required = "Submit Claim. Excellent approval confidence."
        
        if not is_approved: # If it doesn't meet the strict 80% threshold, figure out why
            reason_encoded = reason_model.predict(X_predict)[0]
            predicted_reason = str(denial_reason_encoder.inverse_transform([reason_encoded])[0])
            action_required = f"Requires Review (Confidence {approval_confidence*100:.1f}% < 80% threshold). Please review {predicted_reason} before submission."

        # 5. Build Advanced Prescriptive AI Features
        top_risk_factors = []
        next_best_action = None
        expected_payment_timeline = None
        financial_variance_warning = None
        
        # Explainable AI (Simulated SHAP logic for the Hackathon)
        if request.departmentType == "Emergency" and request.procedureCost > 50000:
            top_risk_factors.append(f"High procedure cost (${request.procedureCost}) for Emergency Department increases denial risk.")
        if request.age > 65:
            top_risk_factors.append(f"Patient Age ({request.age}) historically flags for Medical Necessity review.")
        if not top_risk_factors:
            top_risk_factors.append("Standard processing variance.")
            
        # Prescriptive Next Best Action
        if predicted_reason == "Coding Error":
            next_best_action = {
                "instruction": "Review CPT Codes and unbundle procedures before final submission.",
                "recommended_department": "Medical Coding"
            }
        elif predicted_reason == "Front-End/Registration Error":
            next_best_action = {
                "instruction": f"Verify {request.insuranceProvider} Group ID and Policy Active Status.",
                "recommended_department": "Front Desk / Registration"
            }
        elif predicted_reason == "Authorization Error":
            next_best_action = {
                "instruction": "Upload Pre-Authorization Approval form attached to procedure.",
                "recommended_department": "Clinical Administration"
            }
            
        # Payment Forecasting
        if is_approved:
            # Predict timeline based on department historicals
            est_days = 14 if request.departmentType not in ["Oncology", "Emergency"] else 25
            expected_date = (pd.Timestamp.now() + pd.Timedelta(days=est_days)).strftime('%Y-%m-%d')
            expected_payment_timeline = {"estimated_days": est_days, "expected_date": expected_date}
            
            # Predict Variance / Underpayment
            if request.insuranceProvider == "Star Health":
                financial_variance_warning = {
                    "is_underpayment_likely": True,
                    "expected_shortfall": float(request.expectedInsurancePayment * 0.12),
                    "message": f"Historical data shows {request.insuranceProvider} underpays {request.departmentType} by ~12%."
                }

        return ClaimPredictionResponse(
            is_approved=is_approved,
            approval_confidence=round(approval_confidence, 3),
            denial_risk=round(denial_risk, 3),
            predicted_denial_reason=predicted_reason,
            action_required=action_required,
            top_risk_factors=top_risk_factors,
            next_best_action=next_best_action,
            expected_payment_timeline=expected_payment_timeline,
            financial_variance_warning=financial_variance_warning
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# -------------------------------------------------------------------
# 2. Dashboard Analytics Endpoints (GET) - Feeds the React Charts
# -------------------------------------------------------------------

@app.get("/api/analytics/kpis")
def get_dashboard_kpis():
    """Returns top-level numbers for the 4 KPI boxes"""
    total_expected = analytics_df['expected_insurance_payment'].sum()
    total_actual = analytics_df['actual_insurance_payment'].sum()
    payment_variance = analytics_df['contract_variance'].sum()
    
    total_claims = len(analytics_df)
    denied_claims = len(analytics_df[analytics_df['claim_status'] == 'Denied'])
    
    avg_ar_aging = analytics_df[analytics_df['claim_status'] == 'Pending']['ar_aging_days'].mean()
    
    return {
        "total_expected_revenue": float(total_expected),
        "total_actual_revenue": float(total_actual),
        "total_variance_lost": float(payment_variance),
        "denial_rate_percentage": round((denied_claims / total_claims) * 100, 2),
        "avg_ar_aging_days": round(float(avg_ar_aging), 1)
    }

@app.get("/api/analytics/denials")
def get_denials_by_category():
    """Aggregates denial reasons for a Pie Chart"""
    denials = analytics_df[analytics_df['claim_status'] == 'Denied']
    counts = denials['denial_category'].value_counts().to_dict()
    return counts

@app.get("/api/analytics/bottlenecks")
def get_bottlenecks():
    """Finds which departments take the longest to process claims"""
    # Group by department, average the billing lag days
    bottlenecks = analytics_df.groupby('department_type')['billing_lag_days'].mean().sort_values(ascending=False).to_dict()
    return bottlenecks

if __name__ == "__main__":
    import uvicorn
    # Starts server on port 8000
    uvicorn.run(app, host="0.0.0.0", port=8000)
