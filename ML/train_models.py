import pandas as pd
import numpy as np
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from xgboost import XGBClassifier
from sklearn.metrics import accuracy_score, classification_report
import warnings
warnings.filterwarnings('ignore')

print("Loading Synthetic Healthcare RCM Dataset...")
df = pd.read_csv("data/synthetic_healthcare_rcm_dataset.csv")

# ==============================================================================
# 1. Feature Engineering & Preprocessing
# ==============================================================================
print("Preprocessing features...")

# We only train on things the hospital KNOWS *before* submitting the claim.
# We cannot train on "payment_date" or "contract_variance" because those happen 
# AFTER the prediction point.
features = [
    'age', 'sex', 'insurance_provider', 'insurance_type', 
    'department_type', 'emr_system', 'billing_system', 
    'medicine_cost', 'procedure_cost', 'room_charges', 
    'total_bill_amount', 'expected_insurance_payment', 'patient_payable_amount'
]

X = df[features].copy()

# Label Encode categorical features
label_encoders = {}
categorical_cols = X.select_dtypes(include=['object']).columns

for col in categorical_cols:
    le = LabelEncoder()
    # We convert all values to string to avoid mixed type errors
    X[col] = le.fit_transform(X[col].astype(str))
    label_encoders[col] = le

# Save the label encoders so the FastAPI backend can use them to encode incoming JSON requests
joblib.dump(label_encoders, 'models/label_encoders.pkl')
print("Saved Label Encoders to models/label_encoders.pkl")

# ==============================================================================
# Model 1: Claim Denial Predictor (Binary Classification)
# ==============================================================================
print("\n--- Training Model 1: Claim Approval Predictor ---")
# Target 1: Is it Approved (1) or Denied/Pending (0)?
y_approval = np.where(df['claim_status'] == 'Approved', 1, 0)

X_train_app, X_test_app, y_train_app, y_test_app = train_test_split(X, y_approval, test_size=0.2, random_state=42)

clf_approval = XGBClassifier(
    n_estimators=100, 
    max_depth=5, 
    learning_rate=0.1, 
    use_label_encoder=False, 
    eval_metric='logloss',
    random_state=42
)

# Train the model
clf_approval.fit(X_train_app, y_train_app)

# Evaluate
y_pred_app = clf_approval.predict(X_test_app)
print(f"Approval Model Accuracy: {accuracy_score(y_test_app, y_pred_app):.4f}")
print("Classification Report:")
print(classification_report(y_test_app, y_pred_app))

# Save the model
import os
os.makedirs('models', exist_ok=True)
joblib.dump(clf_approval, 'models/claim_approval_model.pkl')
print("Saved Approval Model to models/claim_approval_model.pkl")

# ==============================================================================
# Model 2: Denial Reason Predictor (Multi-Class Classification)
# ==============================================================================
print("\n--- Training Model 2: Denial Reason Predictor ---")
# We only train this model on claims that WERE actually denied
denied_df = df[df['claim_status'] == 'Denied'].copy()

# Ensure we don't have NaNs in the target
denied_df = denied_df.dropna(subset=['denial_category'])

X_denial = denied_df[features].copy()

# Re-encode features for the subset using the SAME encoders
for col in categorical_cols:
    X_denial[col] = label_encoders[col].transform(X_denial[col].astype(str))

# Encode the Target (Denial Categories)
y_reason_encoder = LabelEncoder()
y_reason = y_reason_encoder.fit_transform(denied_df['denial_category'])

# Save the reason encoder so FastAPI knows how to map back to the text reason
joblib.dump(y_reason_encoder, 'models/denial_reason_encoder.pkl')
print("Saved Denial Reason Encoder to models/denial_reason_encoder.pkl")

X_train_reas, X_test_reas, y_train_reas, y_test_reas = train_test_split(X_denial, y_reason, test_size=0.2, random_state=42)

clf_reason = XGBClassifier(
    n_estimators=100, 
    max_depth=6, 
    learning_rate=0.1, 
    objective='multi:softmax',
    use_label_encoder=False, 
    eval_metric='mlogloss',
    random_state=42
)

# Train the model
clf_reason.fit(X_train_reas, y_train_reas)

# Evaluate
y_pred_reas = clf_reason.predict(X_test_reas)
print(f"Denial Reason Model Accuracy: {accuracy_score(y_test_reas, y_pred_reas):.4f}")
print("Classification Report:")
print(classification_report(y_test_reas, y_pred_reas, target_names=y_reason_encoder.classes_))

# Save the model
joblib.dump(clf_reason, 'models/denial_reason_model.pkl')
print("Saved Denial Reason Model to models/denial_reason_model.pkl")

print("\nStep 1 Complete! All models and encoders saved to the 'models' directory.")
