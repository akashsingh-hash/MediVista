package com.example.medivista.service;

import com.example.medivista.entity.Hospital;
import com.example.medivista.repository.HospitalRepository;
import com.example.medivista.exception.ResourceAlreadyExistsException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final HospitalRepository hospitalRepository;
    private final PasswordEncoder passwordEncoder;

    public Hospital signup(Hospital hospital) {
        if (hospitalRepository.existsByHospitalName(hospital.getHospitalName())) {
            throw new ResourceAlreadyExistsException(
                    "A hospital with this name is already registered. Please use a unique name.");
        }
        if (hospitalRepository.existsByEmail(hospital.getEmail())) {
            throw new ResourceAlreadyExistsException(
                    "This email is already in use. Please use a different email address.");
        }
        hospital.setPassword(passwordEncoder.encode(hospital.getPassword()));
        return hospitalRepository.save(hospital);
    }

    public Optional<Hospital> login(String email, String password) {
        Optional<Hospital> hospitalOpt = hospitalRepository.findByEmail(email);
        if (hospitalOpt.isPresent() && passwordEncoder.matches(password, hospitalOpt.get().getPassword())) {
            return hospitalOpt;
        }
        return Optional.empty();
    }
}
