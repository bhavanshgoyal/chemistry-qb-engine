package com.chemistryqb.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "diagnostic_results")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DiagnosticResult {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long questionId;
    private Boolean isCorrect;
    private Integer timeTaken; // in seconds
    private Integer studentConfidence; // 1-5
}
