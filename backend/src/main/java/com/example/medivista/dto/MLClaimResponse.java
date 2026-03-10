package com.example.medivista.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MLClaimResponse {
    @JsonProperty("is_approved")
    private Boolean isApproved;

    @JsonProperty("approval_confidence")
    private Double approvalConfidence;

    @JsonProperty("denial_risk")
    private Double denialRisk;

    @JsonProperty("predicted_denial_reason")
    private String predictedDenialReason;

    @JsonProperty("action_required")
    private String actionRequired;

    @JsonProperty("top_risk_factors")
    private List<String> topRiskFactors;

    @JsonProperty("next_best_action")
    private NextBestActionDTO nextBestAction;

    @JsonProperty("expected_payment_timeline")
    private PaymentTimelineDTO expectedPaymentTimeline;

    @JsonProperty("financial_variance_warning")
    private FinancialVarianceWarningDTO financialVarianceWarning;
}
