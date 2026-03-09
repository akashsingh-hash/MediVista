package com.example.medivista.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FinancialVarianceWarningDTO {
    @JsonProperty("alert_level")
    private String alertLevel;

    @JsonProperty("expected_payment")
    private Double expectedPayment;

    @JsonProperty("historical_avg_payment")
    private Double historicalAvgPayment;

    private String message;
}
