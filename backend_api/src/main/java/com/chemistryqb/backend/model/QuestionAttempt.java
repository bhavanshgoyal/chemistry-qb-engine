package com.chemistryqb.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "question_attempts")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class QuestionAttempt {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long questionId;
    private Boolean isCorrect;
    private Boolean isSkipped;
    private Integer confidenceLevel; // 1-5
    private Integer timeSpentSeconds;

    @CreationTimestamp
    private LocalDateTime attemptTimestamp;
}
