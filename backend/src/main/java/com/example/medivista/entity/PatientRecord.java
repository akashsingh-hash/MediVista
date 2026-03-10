package com.example.medivista.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "patient_records")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PatientRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String patientName;
    private Integer age;
    @Enumerated(EnumType.STRING)
    private Sex sex; // "M", "F"

    // Insurance Information
    @Enumerated(EnumType.STRING)
    private InsuranceProvider insuranceProvider;

    @Enumerated(EnumType.STRING)
    private InsuranceType insuranceType; // Private, Government, Employer

    // Hospital & Treatment Information
    @Enumerated(EnumType.STRING)
    private DepartmentType departmentType;

    @Enumerated(EnumType.STRING)
    private EMRSystem emrSystem; // Practo_EMR, KareXpert, etc.

    @Enumerated(EnumType.STRING)
    private BillingSystem billingSystem; // Tally_Billing, etc.

    // Financial Costs
    private Double medicineCost;
    private Double procedureCost;
    private Double roomCharges;
    private Double expectedInsurancePayment;
    private Double patientPayableAmount;

    // ML Analysis Results
    private Boolean isApproved;
    private Double approvalConfidence;
    private Double denialRisk;
    private String predictedDenialReason;
    private String actionRequired;

    // Expanded ML Results
    private String nextBestActionInstruction;
    private String nextBestActionDepartment;
    private Integer estimatedDaysToPay;
    private String expectedDate;
    private String financialAlertLevel;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hospital_id", nullable = false)
    private Hospital hospital;
}
