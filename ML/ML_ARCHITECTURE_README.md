# ML Architecture for MediVista RCM Dashboard

This document provides a detailed overview of the two Machine Learning models powering the MediVista Revenue Cycle Management (RCM) Operational Intelligence Dashboard. It acts as a reference for backend and frontend integration, as well as an explanation for the Hackathon Judges.

---

## 🏗 ML Architecture Overview
Our pipeline processes structured healthcare tabular data to intelligently predict if a claim will be successful *before* it gets sent to the insurance company. This solves the core problem statement of **reducing denial rates** and **preventing revenue leakage**.

We utilize **XGBoost (Extreme Gradient Boosting)** to power both predictive models.

---

## Model 1: Claim Denial Predictor (Binary Classification)

### 🎯 Problem it Solves
Healthcare organizations often submit claims blindly, waiting 30-60 days only to find out the claim was denied. This leads to massive "Aging Receivables" and strangles cash flow.

**The Solution:** Model 1 instantly predicts the **Probability of Denial** the moment the billing staff attempts to submit the claim in the system.

### ⚙️ How it Works
*   **Target Variable:** `claim_status` (Approved vs. Denied).
*   **Input Features:** 13 variables known *prior* to submission, including `department_type`, `total_bill_amount`, `patient_age`, and the `insurance_provider`.
*   **Output:** An `approval_confidence` percentage. 
*   **Impact:** If the model predicts an 85% chance of denial, the UI can block the submission, forcing the billing staff to double-check the claim details. This directly improves the **First-Pass Acceptance Rate**.

---

## Model 2: Root Cause Predictor (Multi-class Classification)

### 🎯 Problem it Solves
Telling a hospital "This claim will be denied" is not enough. They need to know *why* so they can fix it. Identifying performance bottlenecks and operational inefficiencies rapidly is the main goal of the dashboard.

**The Solution:** If Model 1 flags a claim as high-risk, Model 2 predicts the **Denial Category** (The *Why*).

### ⚙️ How it Works
*   **Target Variable:** `denial_category` (e.g., Coding Error, Registration Error, Authorization Missing).
*   **Input Features:** The same 13 pre-submission variables.
*   **Output:** The exact predicted text reason.
*   **Impact:** The system flashes an alert: *"High Risk of Denial: Please check for Front-End/Registration Errors before submitting."* The staff fixes the missing patient ID, and the claim goes through successfully.

---

## 🧠 Why We Chose XGBoost over Deep Learning

When defending our tech stack to the hackathon judges, here is exactly why we selected **XGBoost** instead of Neural Networks (Deep Learning):

1. **Superior on Tabular Data:** Deep Learning excels at unstructured data (images, text, video). However, for **Structured Tabular Data** (rows and columns of billing amounts, dates, and categories), tree-based ensemble models like XGBoost consistently outperform Deep Learning in both speed and accuracy.

2. **Model Explainability (Crucial for Healthcare):** Neural Networks are "black boxes." If a Deep Learning model denies a claim, we cannot easily explain *why* it made that decision. XGBoost easily provides **Feature Importance** (e.g., we can see that "Cardiology" and "Bill > $10,000" were the main driving factors of the denial). Explainability is mandatory in healthcare operations.
   - **SHAP Integration (SHapley Additive exPlanations):** To take explainability to the next level, we can use **SHAP values** alongside XGBoost. Especially for Model 2, SHAP allows us to show the billing staff exactly *how much* each specific field (like `patient_age` or `emr_system`) contributed to the predicted denial reason for that *exact* claim. This provides absolute transparency to the hospital administrators.

3. **Performance & API Speed:** A real-time dashboard requires split-second inference. XGBoost `.pkl` models are extremely lightweight. When the Next.js React frontend hits our FastAPI endpoint, XGBoost computes the prediction and returns the JSON payload in **milliseconds**, ensuring a snappy, seamless user experience without needing expensive GPU cloud hosting.
