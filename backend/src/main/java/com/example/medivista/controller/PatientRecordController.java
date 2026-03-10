package com.example.medivista.controller;

import com.example.medivista.dto.PatientRecordDTO;
import com.example.medivista.service.PatientRecordService;
import com.example.medivista.exception.UnauthorizedException;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/records")
@RequiredArgsConstructor
public class PatientRecordController {

    private final PatientRecordService patientRecordService;

    @PostMapping
    public ResponseEntity<?> createRecord(@RequestBody PatientRecordDTO dto, HttpSession session) {
        Long hospitalId = (Long) session.getAttribute("hospitalId");
        if (hospitalId == null) {
            throw new UnauthorizedException("User not logged in");
        }

        PatientRecordDTO savedRecord = patientRecordService.createRecord(dto, hospitalId);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedRecord);
    }

    @GetMapping
    public ResponseEntity<?> getHospitalRecords(HttpSession session) {
        Long hospitalId = (Long) session.getAttribute("hospitalId");
        if (hospitalId == null) {
            throw new UnauthorizedException("User not logged in");
        }

        return ResponseEntity.ok(patientRecordService.getHospitalRecords(hospitalId));
    }
}
