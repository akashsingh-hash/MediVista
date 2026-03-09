package com.example.medivista.repository;

import com.example.medivista.entity.PatientRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PatientRecordRepository extends JpaRepository<PatientRecord, Long> {
    List<PatientRecord> findByHospitalId(Long hospitalId);
}
