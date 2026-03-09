package com.example.medivista.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentTimelineDTO {
    @JsonProperty("estimated_days_to_pay")
    private Integer estimatedDaysToPay;

    @JsonProperty("expected_date")
    private String expectedDate;
}
