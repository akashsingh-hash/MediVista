# RCM Intelligence API - Payload Explanation Guide

This guide breaks down the advanced `JSON` output returned by our Machine Learning API (`POST /api/predict/claim`). Use this document to explain the "intelligence" of our dashboard to the judges and guide the Frontend/Backend teams on how to display these fields.

---

## 1. Core Predictive Fields

### `is_approved` (Boolean) & `approval_confidence` (Float)
*   **What it is:** The primary binary prediction from the XGBoost model indicating whether the claim will be paid by the insurance company. The confidence score shows how "sure" the AI is.
*   **Scenario for Judges:** *"Instead of a billing agent submitting a claim blindly, our AI instantly calculates a 92% confidence that the claim will be approved based on historical data. If it drops below 50%, `is_approved` becomes false, stopping the user from making a mistake."*

### `denial_risk` (Float)
*   **What it is:** The inverse of the approval confidence. If the risk crosses a certain threshold (e.g., > 40%), it triggers the secondary AI model to figure out *why*.
*   **Scenario for Judges:** *"We treat any risk over 40% as a 'High-Risk Claim'. Even if it might get approved, a 43% risk of denial means the hospital is gambling with thousands of dollars, so our AI flags it for manual review."*

---

## 2. Prescriptive Intelligence (The "Wow" Factor)

### `predicted_denial_reason` (String)
*   **What it is:** The output of Model 2. It categorizes the likely failure point into standard RCM buckets (e.g., "Coding Error", "Front-End/Registration Error").
*   **Scenario for Judges:** *"Telling a user 'This will be denied' is useless if they don't know how to fix it. Our multi-class model isolates the exact department responsible for the likely error."*

### `top_risk_factors` (List of Strings - SHAP Explainability)
*   **What it is:** Explainable AI (XAI). It tells the user exactly *which* fields on the form triggered the high denial risk.
*   **Scenario for Judges:** *"In healthcare, AI cannot be a black box. Our system uses explainability algorithms to tell the auditor: 'This claim is risky specifically because the patient is over 65 (Medicare Flag) and the procedure cost exceeds $50,000 in the Emergency Department'."*

### `next_best_action` (JSON Object)
*   **What it is:** "Prescriptive AI". Instead of just predicting a problem, it prescribes the solution and assigns it to a specific department.
*   **Example Output:**
    ```json
    "next_best_action": {
      "instruction": "Review CPT Codes and unbundle procedures before final submission.",
      "recommended_department": "Medical Coding"
    }
    ```
*   **Scenario for Judges:** *"We elevated our dashboard from a passive reporting tool to an active workflow manager. If the AI predicts a Coding Error, it instantly generates a 'Next Best Action' routing the claim to the Medical Coding team to unbundle the CPT codes before it ever reaches the insurance company."*

---

## 3. Financial Forecasting

### `expected_payment_timeline` (JSON Object)
*   **What it is:** Predicts *when* the cash will actually hit the hospital's bank account if the claim is approved.
*   **Example Output:**
    ```json
    "expected_payment_timeline": {
      "estimated_days": 14,
      "expected_date": "2024-06-28"
    }
    ```
*   **Scenario for Judges:** *"To solve the 'Delayed reporting of financial metrics' problem, our AI predicts the exact reimbursement date based on historical lag times for that specific insurance provider and hospital department. This allows the CFO to accurately forecast next month's cash flow."*

### `financial_variance_warning` (JSON Object)
*   **What it is:** Evaluates "Contract Variances" (when an insurance company quietly pays less than the negotiated rate).
*   **Example Output:**
    ```json
    "financial_variance_warning": {
      "is_underpayment_likely": true,
      "expected_shortfall": 16800.0,
      "message": "Historical data shows Star Health underpays Cardiology by ~12%."
    }
    ```
*   **Scenario for Judges:** *"We noticed a massive gap in RCM: Hospitals expect $100,000 but only receive $88,000. Our API alerts the billing staff to expect an underpayment *before* it happens, completely eliminating the 'surprise' of lost revenue."*
