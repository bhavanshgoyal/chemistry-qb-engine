package com.chemistryqb.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "ingestion_documents")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class IngestionDocument {

    @Id
    private String id;

    private String jobId;

    private String originalFilename;

    private String status;

    private Integer totalChunks;

    private Integer completedChunks;

    private Integer failedChunks;

    private Integer totalSaved;

    @Column(columnDefinition = "TEXT")
    private String message;

    @Column(columnDefinition = "TEXT")
    private String extractedText;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
