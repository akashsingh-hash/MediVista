package com.example.medivista.repository;

import com.example.medivista.entity.Hospital;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface HospitalRepository extends JpaRepository<Hospital, Long> {
    Optional<Hospital> findByEmail(String email);
    boolean existsByHospitalName(String hospitalName);
    boolean existsByEmail(String email);
}
