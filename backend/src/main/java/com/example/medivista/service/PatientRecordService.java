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

    public PatientRecord createRecord(PatientRecordDTO dto, Long hospitalId) {
        Hospital hospital = hospitalRepository.findById(hospitalId)
                .orElseThrow(() -> new ResourceNotFoundException("Hospital not found"));

        PatientRecord record = PatientRecord.builder()
                .patientName(dto.getPatientName())
                .age(dto.getAge())
                .sex(dto.getSex())
                .insuranceProvider(dto.getInsuranceProvider())
                .insuranceType(dto.getInsuranceType())
                .departmentType(dto.getDepartmentType())
                .emrSystem(dto.getEmrSystem())
                .billingSystem(dto.getBillingSystem())
                .medicineCost(dto.getMedicineCost())
                .procedureCost(dto.getProcedureCost())
                .roomCharges(dto.getRoomCharges())
                .expectedInsurancePayment(dto.getExpectedInsurancePayment())
                .patientPayableAmount(dto.getPatientPayableAmount())
                // ML Fields
                .isApproved(dto.getIsApproved())
                .approvalConfidence(dto.getApprovalConfidence())
                .denialRisk(dto.getDenialRisk())
                .predictedDenialReason(dto.getPredictedDenialReason())
                .actionRequired(dto.getActionRequired())
                .hospital(hospital)
                .build();

        return patientRecordRepository.save(record);
    }

    public List<PatientRecordDTO> getHospitalRecords(Long hospitalId) {
        return patientRecordRepository.findByHospitalId(hospitalId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    private PatientRecordDTO convertToDTO(PatientRecord record) {
        return PatientRecordDTO.builder()
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
                .build();
    }
}
