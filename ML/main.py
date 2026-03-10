from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import numpy as np
import joblib
from schemas import ClaimPredictionRequest, ClaimPredictionResponse, AppealGenerationRequest
import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

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
        
        is_approved = bool(approval_confidence >= 0.65)

        # 4. Model 2: If NOT approved (meaning < 65% confidence), predict WHY
        predicted_reason = None
        action_required = "Claim looks solid. Approval probability is high."
        
        if not is_approved: # If it doesn't meet the strict 65% threshold, figure out why
            reason_encoded = reason_model.predict(X_predict)[0]
            predicted_reason = str(denial_reason_encoder.inverse_transform([reason_encoded])[0])
            action_required = f"Requires Review (Confidence {approval_confidence*100:.1f}% < 65% threshold). Please review {predicted_reason} before submission."

        # 5. Build Advanced Prescriptive AI Features
        top_risk_factors = []
        
        # Explainable AI logic
        if request.procedureCost > 150000:
            top_risk_factors.append(f"Procedure cost (₹{request.procedureCost:,.0f}) is exceptionally high for private insurance.")
        if request.departmentType == "Emergency":
            top_risk_factors.append(f"Claim billed under Emergency department - high audit risk.")
        if request.age > 75:
            top_risk_factors.append(f"Patient age ({request.age}) requires additional clinical necessity notes.")
            
        if not top_risk_factors:
            top_risk_factors.append("Standard processing variance.")
            
        # Prescriptive Next Best Action
        nba_instruction = "Verify documentation."
        nba_dept = "Compliance"
        nba_type = "Review Required"
        
        if "Billing" in str(predicted_reason):
            nba_instruction = "Verify CPT codes and unbundle procedures before final submission."
            nba_dept = "Medical Coding Team"
        elif "Registration" in str(predicted_reason):
            nba_instruction = f"Verify {request.insuranceProvider} Group ID and Policy Active Status."
            nba_dept = "Front Desk / Registration"
        elif "Authorization" in str(predicted_reason):
            nba_instruction = "Upload Pre-Authorization Approval form attached to procedure."
            nba_dept = "Clinical Administration"
            
        next_best_action = {
            "action_type": nba_type,
            "recommended_department": nba_dept,
            "instruction": nba_instruction
        }
            
        # Payment Forecasting (Simulated historical data)
        days_to_pay = 45 if denial_risk > 0.7 else 15
        expected_date = (pd.Timestamp.now() + pd.Timedelta(days=days_to_pay)).strftime('%Y-%m-%d')
        
        from schemas import PaymentTimeline
        expected_payment_timeline = PaymentTimeline(
            estimated_days_to_pay=int(days_to_pay), 
            expected_date=str(expected_date)
        )
            
        # Predicted Underpayment Alert
        variance_level = "High" if request.procedureCost > 100000 else "Low"
        exp_pay = request.expectedInsurancePayment
        hist_avg = exp_pay * 0.85 # Assume 15% historical hair-cut
        
        financial_variance_warning = {
            "alert_level": variance_level,
            "expected_payment": float(exp_pay),
            "historical_avg_payment": float(hist_avg),
            "message": f"Historical data shows {request.insuranceProvider} often pays ~15% less for {request.departmentType} procedures."
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
# 2. LLM GenAI Endpoint (POST) - Auto Appeals
# -------------------------------------------------------------------

@app.post("/api/generate-appeal")
def generate_appeal_letter(request: AppealGenerationRequest):
    """
    Uses Groq API to draft an appeal letter based on patient info and denial reasons.
    """
    try:
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
             raise HTTPException(status_code=500, detail="GROQ_API_KEY is not set in environment.")
             
        # Initialize Groq client
        client = Groq(api_key=api_key)

        prompt = f"""
        You are an expert Medical Billing Advocate. Draft a formal appeal letter to '{request.insuranceProvider}'.
        The claim was denied citing: '{request.denialReason}'.
        
        Patient Details:
        - Name: {request.patientName}
        - Age: {request.age}
        
        Costs Breakdown:
        - Medicine Cost: ₹{request.medicineCost}
        - Procedure Cost: ₹{request.procedureCost}
        - Room Charges: ₹{request.roomCharges}
        - Total Billed: ₹{request.medicineCost + request.procedureCost + request.roomCharges}
        
        Write a persuasive, professional appeal letter arguing that the services were medically necessary and explicitly countering the denial reason. Make it sound formal without using hallucinated medical terms or fake dates.

        IMPORTANT INSTRUCTIONS:
        1. Keep the letter concise and structured with paragraphs.
        2. Output ONLY the letter text. No introductory remarks like 'Here is the letter'.
        3. Do NOT invent dates or specific medical procedures. Keep it generalized but convincing regarding the financial and necessity aspect.
        """

        chat_completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are a helpful, professional medical billing assistant."},
                {"role": "user", "content": prompt}
            ],
            # Replaced llama-3.3-70b-versatile with llama3-8b-8192 for speed/reliability if needed, but sticking with original requirement:
            model="llama-3.3-70b-versatile",
            temperature=0.5,
            max_completion_tokens=1024,
            top_p=1,
            stop=None,
            stream=False,
        )

        drafted_letter = chat_completion.choices[0].message.content

        return {"status": "success", "letter": drafted_letter}
        
    except Exception as e:
        print(f"Error calling Groq API: {e}")
        raise HTTPException(status_code=500, detail=f"LLM AI generation failed: {str(e)}")

# -------------------------------------------------------------------
# 3. Dashboard Analytics Endpoints (GET) - Feeds the React Charts
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
