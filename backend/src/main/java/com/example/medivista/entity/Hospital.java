package com.example.medivista.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "hospitals")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Hospital {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String hospitalName;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String location;

    @Column(nullable = false)
    private String billingStaffName;

    @Column(nullable = false)
    private String password;
}
