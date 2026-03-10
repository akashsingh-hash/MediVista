package com.example.medivista.service;

import com.example.medivista.entity.Hospital;
import com.example.medivista.entity.PatientRecord;
import com.example.medivista.repository.HospitalRepository;
import com.example.medivista.repository.PatientRecordRepository;
import com.example.medivista.dto.PatientRecordDTO;
import com.example.medivista.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PatientRecordService {

    private final PatientRecordRepository patientRecordRepository;
    private final HospitalRepository hospitalRepository;
    private final org.springframework.web.client.RestTemplate restTemplate;

    private static final String ML_API_URL = "http://localhost:8000/api/predict/claim";

    public PatientRecordDTO createRecord(PatientRecordDTO dto, Long hospitalId) {
        Hospital hospital = hospitalRepository.findById(hospitalId)
                .orElseThrow(() -> new ResourceNotFoundException("Hospital not found"));

        double medicineCost = dto.getMedicineCost() != null ? dto.getMedicineCost() : 0.0;
        double procedureCost = dto.getProcedureCost() != null ? dto.getProcedureCost() : 0.0;
        double roomCharges = dto.getRoomCharges() != null ? dto.getRoomCharges() : 0.0;
        double totalBillAmount = medicineCost + procedureCost + roomCharges;

        Boolean isApproved = dto.getIsApproved();
        Double approvalConfidence = dto.getApprovalConfidence();
        Double denialRisk = dto.getDenialRisk();
        String predictedDenialReason = dto.getPredictedDenialReason();
        String actionRequired = dto.getActionRequired();

        PatientRecord record = PatientRecord.builder()
                .patientName(dto.getPatientName())
                .age(dto.getAge())
                .sex(dto.getSex())
                .insuranceProvider(dto.getInsuranceProvider())
                .insuranceType(dto.getInsuranceType())
                .departmentType(dto.getDepartmentType())
                .emrSystem(dto.getEmrSystem())
                .billingSystem(dto.getBillingSystem())
                .medicineCost(medicineCost)
                .procedureCost(procedureCost)
                .roomCharges(roomCharges)
                .expectedInsurancePayment(dto.getExpectedInsurancePayment())
                .patientPayableAmount(dto.getPatientPayableAmount())
                // ML Fields
                .isApproved(isApproved)
                .approvalConfidence(approvalConfidence)
                .denialRisk(denialRisk)
                .predictedDenialReason(predictedDenialReason)
                .actionRequired(actionRequired)
                .nextBestActionInstruction(dto.getNextBestActionInstruction())
                .nextBestActionDepartment(dto.getNextBestActionDepartment())
                .estimatedDaysToPay(dto.getEstimatedDaysToPay())
                .expectedDate(dto.getExpectedDate())
                .financialAlertLevel(dto.getFinancialAlertLevel())
                .claimDate(dto.getClaimDate())
                .hospital(hospital)
                .build();

        return convertToDTO(patientRecordRepository.save(record));
    }

    public List<PatientRecordDTO> getHospitalRecords(Long hospitalId) {
        return patientRecordRepository.findByHospitalId(hospitalId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public PatientRecordDTO convertToDTO(PatientRecord record) {
        return PatientRecordDTO.builder()
                .id(record.getId())
                .patientName(record.getPatientName())
                .age(record.getAge())
                .sex(record.getSex())
                .insuranceProvider(record.getInsuranceProvider())
                .insuranceType(record.getInsuranceType())
                .departmentType(record.getDepartmentType())
                .emrSystem(record.getEmrSystem())
                .billingSystem(record.getBillingSystem())
                .medicineCost(record.getMedicineCost())
                .procedureCost(record.getProcedureCost())
                .roomCharges(record.getRoomCharges())
                .expectedInsurancePayment(record.getExpectedInsurancePayment())
                .patientPayableAmount(record.getPatientPayableAmount())
                .isApproved(record.getIsApproved())
                .approvalConfidence(record.getApprovalConfidence())
                .denialRisk(record.getDenialRisk())
                .predictedDenialReason(record.getPredictedDenialReason())
                .actionRequired(record.getActionRequired())
                .nextBestActionInstruction(record.getNextBestActionInstruction())
                .nextBestActionDepartment(record.getNextBestActionDepartment())
                .estimatedDaysToPay(record.getEstimatedDaysToPay())
                .expectedDate(record.getExpectedDate())
                .financialAlertLevel(record.getFinancialAlertLevel())
                .claimDate(record.getClaimDate())
                .build();
    }
}
