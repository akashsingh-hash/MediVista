import pandas as pd
import numpy as np
from faker import Faker
import random
from datetime import timedelta
from tqdm import tqdm

fake = Faker()

NUM_ROWS = 100000

# Possible values
sexes = ["M", "F"]

# Possible values for advanced KPIs
insurance_providers = [
    "Star Health",
    "HDFC ERGO",
    "Niva Bupa",
    "ICICI Lombard",
    "New India Assurance",
    "Bajaj Allianz"
]

insurance_types = ["Private", "Government", "Employer"]
departments = ["Cardiology", "Neurology", "Orthopedics", "Radiology", "Emergency", "Oncology"]
treatments = ["Surgery", "MRI Scan", "Chemotherapy", "Angioplasty", "Physiotherapy", "CT Scan", "General Treatment"]

# Categorized Denial Reasons for RCA (Root Cause Analysis)
denial_categories = {
    "Front-End/Registration Error": ["Missing Patient Information", "Coverage Expired", "Invalid Insurance ID"],
    "Medical Coding Error": ["Incorrect CPT Code", "Duplicate Claim", "Unbundled Codes"],
    "Clinical/Medical Necessity": ["Procedure Not Medically Necessary", "Experimental Treatment"],
    "Authorization Error": ["Pre-Authorization Missing", "Out-of-Network Provider"]
}
denial_reasons_flat = [(cat, reason) for cat, reasons in denial_categories.items() for reason in reasons]

# Simulated Source Systems
emr_systems = ["Practo_EMR", "KareXpert", "Epic_India", "Custom_Inhouse"]
billing_systems = ["Tally_Billing", "Oracle_Health", "SAP_Healthcare"]

data = []
SNAPSHOT_DATE = pd.to_datetime("2024-05-15").date() # fixed snapshot for AR calculation

START_DATE = pd.to_datetime("2023-05-15").date()

for i in tqdm(range(NUM_ROWS)):
    claim_id = f"CLM-{1000000 + i}"
    age = random.randint(1,90)
    sex = random.choice(["M", "F"])

    insurance_provider = random.choice(insurance_providers)
    insurance_type = random.choice(insurance_types)
    coverage_limit = random.randint(300000, 2000000)

    department = random.choice(departments)
    treatment = random.choice(treatments)
    emr_system = random.choice(emr_systems)
    billing_system = random.choice(billing_systems)

    admission_date = fake.date_between(start_date=START_DATE, end_date=SNAPSHOT_DATE)
    stay_days = random.randint(1,10)
    discharge_date = admission_date + timedelta(days=stay_days)
    
    # 6. Bottlenecks: Emergency and Oncology typically take longer to bill due to complex coding
    if department in ["Emergency", "Oncology"]:
        billing_lag_days = random.randint(5, 20)
    else:
        billing_lag_days = random.randint(1, 5)

    claim_submission_date = discharge_date + timedelta(days=billing_lag_days)

    medicine_cost = random.randint(1000, 50000)
    procedure_cost = random.randint(10000, 500000)
    room_charges = stay_days * random.randint(2000, 15000)
    total_bill = medicine_cost + procedure_cost + room_charges

    # Initial calculated coverage vs expected
    insurance_cover = min(random.randint(int(total_bill*0.4), int(total_bill*0.9)), coverage_limit)
    expected_insurance_payment = insurance_cover
    patient_payable = total_bill - expected_insurance_payment

    # Dynamic Claim Status Logic for Highly Realistic Indian RCM
    # Target: ~65% Approved, 30% Denied, 5% Pending overall
    approve_prob = 0.65
    deny_prob = 0.30
    pend_prob = 0.05
    
    # 1. The EMR / Billing Mismatch Rule (Coding Errors)
    # Modern EMR paired with Legacy Billing System often results in dropped codes
    if emr_system in ["Practo_EMR", "Epic_India"] and billing_system == "Tally_Billing":
        approve_prob -= 0.15
        deny_prob += 0.15
        forced_denial_reason = ("Medical Coding Error", random.choice(["Incorrect CPT Code", "Unbundled Codes"]))
    else:
        forced_denial_reason = None

    # 2. Government Insurance + Heavy Procedure Rule (Authorization)
    # Govt programs like Ayushman Bharat require strict pre-auth for major surgeries
    if insurance_type == "Government" and department in ["Emergency", "Oncology", "Cardiology"]:
        approve_prob -= 0.20
        deny_prob += 0.15
        pend_prob += 0.05
        if not forced_denial_reason:
            forced_denial_reason = ("Authorization Error", "Pre-Authorization Missing")

    # 3. Medical Necessity / Value Mismatch Rule
    # If the hospital is billing massive amounts but insurance expected payment is extremely low
    if (expected_insurance_payment / total_bill) < 0.20 and procedure_cost > 100000:
        approve_prob -= 0.15
        deny_prob += 0.15
        if not forced_denial_reason:
            forced_denial_reason = ("Clinical/Medical Necessity", "Procedure Not Medically Necessary")
        
    # 4. The "Golden Path" Rule for Clean Claims
    # Modern EMR + Modern Billing + Good Insurance Payment Ratio = Extremely High Approval Chance
    if emr_system == "Practo_EMR" and billing_system == "Oracle_Health" and (expected_insurance_payment / total_bill) > 0.70:
        approve_prob = 0.95
        deny_prob = 0.03
        pend_prob = 0.02
        
    # Normalize probabilities to sum to 1
    total = approve_prob + deny_prob + pend_prob
    weights = [max(0.01, approve_prob/total), max(0.01, deny_prob/total), max(0.01, pend_prob/total)]

    claim_status = random.choices(["Approved", "Denied", "Pending"], weights=weights)[0]
    
    # Claim Lifecycle variables
    is_resubmitted_claim = False
    number_of_appeals = 0
    payment_date = None
    payment_amount = 0
    denial_category = None
    denial_reason = None
    contract_variance = 0
    ar_aging_days = 0

    if claim_status == "Approved":
        # 3. Payment Variance: 20% chance the actual payment was exactly expected, otherwise underpaid due to "adjustments"
        if random.random() < 0.20:
            payment_amount = expected_insurance_payment 
        else:
            payment_amount = int(expected_insurance_payment * random.uniform(0.85, 0.99))
            
        contract_variance = expected_insurance_payment - payment_amount
        processing_days = random.randint(7, 45)
        payment_date = claim_submission_date + timedelta(days=processing_days)
        
        # 2. Resubmission logic: Even if accepted, was it accepted on the first try?
        if random.random() < 0.15: # 15% were initially denied and successfully appealed
            is_resubmitted_claim = True
            number_of_appeals = random.randint(1, 2)
            
    elif claim_status == "Denied":
        processing_days = random.randint(3, 14)
        
        # If one of our realistic rules triggered the denial, use that specific reason!
        if forced_denial_reason:
            denial_category = forced_denial_reason[0]
            denial_reason = forced_denial_reason[1]
        else:
            cat_reason_tuple = random.choice(denial_reasons_flat)
            denial_category = cat_reason_tuple[0]
            denial_reason = cat_reason_tuple[1]
        
        # For Denied claims, calculate Aging from submission to snapshot date
        ar_aging_days = (SNAPSHOT_DATE - claim_submission_date).days if claim_submission_date < SNAPSHOT_DATE else 0
        
    else: # Pending
        processing_days = None
        # Calculate AR Aging for Pending
        ar_aging_days = (SNAPSHOT_DATE - claim_submission_date).days if claim_submission_date < SNAPSHOT_DATE else 0
        
        if ar_aging_days > 30 and random.random() < 0.30: # If it's old, it might be in an appeals process
            is_resubmitted_claim = True
            number_of_appeals = 1

    # Fix Negative Aging if future dates were generated due to the 1-year start bound
    if ar_aging_days < 0:
        ar_aging_days = 0
        
    ar_aging_bucket = "N/A"
    if claim_status in ["Pending", "Denied"]:
        if ar_aging_days <= 30: ar_aging_bucket = "0-30 Days"
        elif ar_aging_days <= 60: ar_aging_bucket = "31-60 Days"
        elif ar_aging_days <= 90: ar_aging_bucket = "61-90 Days"
        else: ar_aging_bucket = "90+ Days"

    billing_staff_id = random.randint(1, 40)

    data.append([
        claim_id, age, sex, insurance_provider, insurance_type, coverage_limit,
        department, treatment, emr_system, billing_system, admission_date, discharge_date, stay_days,
        medicine_cost, procedure_cost, room_charges, total_bill, 
        expected_insurance_payment, payment_amount, contract_variance, patient_payable,
        claim_submission_date, billing_lag_days, claim_status, payment_date,
        is_resubmitted_claim, number_of_appeals, denial_category, denial_reason, 
        ar_aging_days, ar_aging_bucket, processing_days, billing_staff_id
    ])

columns = [
    "claim_id", "age", "sex", "insurance_provider", "insurance_type", "coverage_limit",
    "department_type", "treatment_type", "emr_system", "billing_system", "admission_date", "discharge_date", "length_of_stay",
    "medicine_cost", "procedure_cost", "room_charges", "total_bill_amount",
    "expected_insurance_payment", "actual_insurance_payment", "contract_variance", "patient_payable_amount",
    "claim_submission_date", "billing_lag_days", "claim_status", "payment_date",
    "is_resubmitted_claim", "number_of_appeals", "denial_category", "denial_reason",
    "ar_aging_days", "ar_aging_bucket", "insurance_processing_days", "billing_staff_id"
]

df = pd.DataFrame(data, columns=columns)

df.to_csv("data/synthetic_healthcare_rcm_dataset.csv", index=False)

print("Dataset generated successfully!")
print("Rows:", len(df))