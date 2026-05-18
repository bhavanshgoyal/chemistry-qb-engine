package com.chemistryqb.backend.service;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class IngestionService {

    @Autowired
    private AsyncIngestionRunner asyncRunner;
    private final ConcurrentHashMap<String, Map<String, Object>> jobStatus = new ConcurrentHashMap<>();

    @PostConstruct
    private void init() {
        asyncRunner.setJobStatus(jobStatus);
    }

    public String startIngestion(MultipartFile[] files) {
        String jobId = UUID.randomUUID().toString();
        jobStatus.put(jobId, Map.of("status", "processing", "message", "Starting AI analysis..."));

        // Extract file data into memory synchronously
        List<AsyncIngestionRunner.FileData> fileDataList = new ArrayList<>();
        for (MultipartFile file : files) {
            try {
                fileDataList.add(new AsyncIngestionRunner.FileData(file.getOriginalFilename(), file.getBytes()));
            } catch (Exception e) {
                System.err.println("Failed to read bytes for: " + file.getOriginalFilename());
            }
        }

        // CRITICAL FIX: We are passing 'fileDataList' here, NOT 'files'
        asyncRunner.processFilesAsync(jobId, fileDataList);
        return jobId;
    }

    public Map<String, Object> getJobStatus(String jobId) {
        return jobStatus.getOrDefault(jobId, Map.of("status", "not_found"));
    }
}