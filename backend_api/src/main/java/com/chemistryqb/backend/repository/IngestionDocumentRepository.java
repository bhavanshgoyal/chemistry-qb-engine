package com.chemistryqb.backend.repository;

import com.chemistryqb.backend.model.IngestionDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IngestionDocumentRepository extends JpaRepository<IngestionDocument, String> {
    List<IngestionDocument> findByJobId(String jobId);
}
