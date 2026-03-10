package com.example.medivista.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MLClaimRequest {
    private String emrSystem;
    private String billingSystem;
    private Double medicineCost;
    private Double procedureCost;
    private Double roomCharges;
    private Double totalBillAmount;
    private Double expectedInsurancePayment;
    private Double patientPayableAmount;
    private String departmentType;
    private Integer age;
    private String sex;
    private String insuranceProvider;
    private String insuranceType;
}
