package com.example.medivista.controller;

import com.example.medivista.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody com.example.medivista.entity.Hospital hospital) {
        authService.signup(hospital);
        return ResponseEntity.status(HttpStatus.CREATED).body("Hospital registered successfully");
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials, HttpServletRequest request) {
        String email = credentials.get("email");
        String password = credentials.get("password");

        Optional<com.example.medivista.entity.Hospital> hospitalOpt = authService.login(email, password);

        if (hospitalOpt.isPresent()) {
            com.example.medivista.entity.Hospital hospital = hospitalOpt.get();
            HttpSession session = request.getSession(true);
            session.setAttribute("hospitalId", hospital.getId());
            return ResponseEntity.ok(Map.of(
                    "message", "Welcome back! Login successful.",
                    "hospitalName", hospital.getHospitalName()));
        }

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Oops! The email or password you entered is incorrect. Please try again.");
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        return ResponseEntity.ok("Logged out successfully");
    }
}
