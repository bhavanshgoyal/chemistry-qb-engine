package com.chemistryqb.backend.repository;

import com.chemistryqb.backend.model.IngestionChunk;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface IngestionChunkRepository extends JpaRepository<IngestionChunk, Long> {
    List<IngestionChunk> findByJobIdOrderByIdAsc(String jobId);

    List<IngestionChunk> findByDocumentIdOrderByIdAsc(String documentId);

    List<IngestionChunk> findByJobIdAndStatusInOrderByIdAsc(String jobId, Collection<String> statuses);
}
