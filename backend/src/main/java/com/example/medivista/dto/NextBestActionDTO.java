package com.example.medivista.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NextBestActionDTO {
    @JsonProperty("action_type")
    private String actionType;

    @JsonProperty("recommended_department")
    private String recommendedDepartment;

    private String instruction;
}
