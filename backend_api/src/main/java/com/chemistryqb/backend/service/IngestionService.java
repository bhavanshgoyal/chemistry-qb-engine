package com.chemistryqb.backend.service;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Orchestrates the full pipeline:
 * PDF/TXT upload → text extraction → Gemini AI → DB save
 * Delegates async processing to AsyncIngestionRunner (separate bean)
 * so Spring's AOP proxy correctly intercepts the @Async annotation.
 */
@Service
public class IngestionService {

    @Autowired private AsyncIngestionRunner asyncRunner;

    // In-memory job status store (sufficient for single-instance; use Redis for multi-instance)
    private final ConcurrentHashMap<String, Map<String, Object>> jobStatus = new ConcurrentHashMap<>();

    @PostConstruct
    private void init() {
        // Share the job status map with the async runner
        asyncRunner.setJobStatus(jobStatus);
    }

    // ──────────────────────────────────────────────────────────────────────────
    //  Public API
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Starts an async ingestion job for multiple files.
     * @return jobId to poll with getJobStatus()
     */
    public String startIngestion(MultipartFile[] files) {
        String jobId = UUID.randomUUID().toString();
        jobStatus.put(jobId, Map.of("status", "processing", "message", "Starting AI analysis..."));
        // FIX: Call through the injected bean so @Async is intercepted by Spring's AOP proxy.
        // Previously this was a direct self-call (this.processFilesAsync) which bypassed the proxy.
        asyncRunner.processFilesAsync(jobId, files);
        return jobId;
    }

    public Map<String, Object> getJobStatus(String jobId) {
        return jobStatus.getOrDefault(jobId, Map.of("status", "not_found"));
    }
}
