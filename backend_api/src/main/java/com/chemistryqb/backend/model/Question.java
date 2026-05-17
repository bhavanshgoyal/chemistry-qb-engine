package com.chemistryqb.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "questions")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Question {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String chapter;

    private String topic;

    // FIX: subTopic was missing — Python sends "sub_topic", frontend displays "subTopic"
    private String subTopic;

    private Integer bloomLevel;

    @Column(columnDefinition = "TEXT")
    private String questionText;

    @Column(columnDefinition = "TEXT")
    private String explanation;

    private String videoUrl;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
