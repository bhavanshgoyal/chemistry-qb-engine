package com.chemistryqb.backend.service;

import com.chemistryqb.backend.model.IngestionChunk;
import com.chemistryqb.backend.model.IngestionDocument;
import com.chemistryqb.backend.repository.IngestionChunkRepository;
import com.chemistryqb.backend.repository.IngestionDocumentRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class IngestionService {

    @Autowired private AsyncIngestionRunner asyncRunner;
    @Autowired private IngestionDocumentRepository documentRepository;
    @Autowired private IngestionChunkRepository chunkRepository;

    private final ConcurrentHashMap<String, Map<String, Object>> jobStatus = new ConcurrentHashMap<>();

    @PostConstruct
    private void init() {
        asyncRunner.setJobStatus(jobStatus);
    }

    public String startIngestion(MultipartFile[] files) {
        String jobId = UUID.randomUUID().toString();
        jobStatus.put(jobId, Map.of(
                "status", "queued",
                "message", "Upload received. Preparing documents for slow AI generation...",
                "totalSaved", 0
        ));

        List<AsyncIngestionRunner.FileData> fileDataList = new ArrayList<>();
        for (MultipartFile file : files) {
            try {
                fileDataList.add(new AsyncIngestionRunner.FileData(
                        file.getOriginalFilename(),
                        file.getContentType(),
                        file.getBytes()
                ));
            } catch (Exception e) {
                jobStatus.put(jobId, Map.of(
                        "status", "completed_with_errors",
                        "message", "Could not read " + file.getOriginalFilename() + ": " + e.getMessage(),
                        "totalSaved", 0
                ));
            }
        }

        asyncRunner.processFilesAsync(jobId, fileDataList);
        return jobId;
    }

    public Map<String, Object> getJobStatus(String jobId) {
        List<IngestionDocument> documents = documentRepository.findByJobId(jobId);
        List<IngestionChunk> chunks = chunkRepository.findByJobIdOrderByIdAsc(jobId);

        if (documents.isEmpty() && chunks.isEmpty()) {
            return jobStatus.getOrDefault(jobId, Map.of("status", "not_found"));
        }

        int totalChunks = chunks.size();
        int completedChunks = (int) chunks.stream().filter(c -> "completed".equals(c.getStatus())).count();
        int failedChunks = (int) chunks.stream().filter(c -> "failed".equals(c.getStatus())).count();
        int failedDocuments = (int) documents.stream().filter(d -> "failed".equals(d.getStatus())).count();
        int totalSaved = chunks.stream()
                .map(IngestionChunk::getGeneratedCount)
                .filter(n -> n != null)
                .mapToInt(Integer::intValue)
                .sum();

        String status;
        if (totalChunks == 0) {
            status = failedDocuments > 0 ? "failed" : "processing";
        } else if (completedChunks + failedChunks >= totalChunks) {
            status = failedChunks == 0 && failedDocuments == 0 ? "completed" : "completed_with_errors";
        } else {
            status = "processing";
        }

        Map<String, Object> live = jobStatus.getOrDefault(jobId, Map.of());
        String message = String.valueOf(live.getOrDefault("message", buildFallbackMessage(status, completedChunks, totalChunks, totalSaved)));

        Map<String, Object> result = new HashMap<>();
        result.put("status", status);
        result.put("message", message);
        result.put("totalSaved", totalSaved);
        result.put("documentCount", documents.size());
        result.put("totalChunks", totalChunks);
        result.put("completedChunks", completedChunks);
        result.put("failedChunks", failedChunks);
        result.put("failedDocuments", failedDocuments);
        chunks.stream()
                .filter(c -> "processing".equals(c.getStatus()))
                .findFirst()
                .ifPresent(c -> {
                    result.put("currentFile", c.getOriginalFilename());
                    result.put("currentChunk", c.getChunkIndex());
                });
        return result;
    }

    private String buildFallbackMessage(String status, int completedChunks, int totalChunks, int totalSaved) {
        if ("completed".equals(status)) {
            return "Generation complete. Saved " + totalSaved + " questions.";
        }
        if ("completed_with_errors".equals(status)) {
            return "Generation finished with some failed chunks. Saved " + totalSaved + " questions.";
        }
        return "Processing chunk " + Math.max(completedChunks + 1, 1) + " of " + Math.max(totalChunks, 1) + "...";
    }
}
