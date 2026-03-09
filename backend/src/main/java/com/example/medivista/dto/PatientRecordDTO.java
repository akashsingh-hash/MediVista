package com.example.medivista.dto;

import com.example.medivista.entity.*;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PatientRecordDTO {
    private String patientName;
    private Integer age;
    private Sex sex;

    // Insurance Information
    private InsuranceProvider insuranceProvider;
    private InsuranceType insuranceType;

    // Hospital & Treatment Information
    private DepartmentType departmentType;
    private EMRSystem emrSystem;
    private BillingSystem billingSystem;

    // Financial Costs
    private Double medicineCost;
    private Double procedureCost;
    private Double roomCharges;
    private Double expectedInsurancePayment;
    private Double patientPayableAmount;

    // ML Analysis Results (Optional for incoming, populated for outgoing)
    private Boolean isApproved;
    private Double approvalConfidence;
    private Double denialRisk;
    private String predictedDenialReason;
    private String actionRequired;
}
