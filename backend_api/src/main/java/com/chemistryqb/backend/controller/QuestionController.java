package com.chemistryqb.backend.controller;

import com.chemistryqb.backend.model.Question;
import com.chemistryqb.backend.repository.QuestionRepository;
import com.chemistryqb.backend.service.IngestionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/questions")
public class QuestionController {

    @Autowired private QuestionRepository questionRepository;
    @Autowired private IngestionService ingestionService;

    // ── List all questions (FIX: was missing, caused 405 on dashboard load) ──
    @GetMapping
    public ResponseEntity<List<Question>> getAllQuestions() {
        return ResponseEntity.ok(questionRepository.findAll());
    }

    // ── Get single question by ID (for StudentSolve) ──────────────────────────
    @GetMapping("/{id}")
    public ResponseEntity<Question> getQuestion(@PathVariable Long id) {
        return questionRepository.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    // ── Create single question (used by Python ingest_logic.py) ──────────────
    @PostMapping
    public ResponseEntity<Question> createQuestion(@RequestBody Question question) {
        return ResponseEntity.ok(questionRepository.save(question));
    }

    // ── Multi-file upload → async Gemini processing ───────────────────────────
    // Returns 202 Accepted immediately with a jobId for polling.
    // FIX: was returning 200 "success" without doing anything — now returns
    //      202 + jobId so the frontend polls /status/{jobId} for real completion.
    @PostMapping("/upload")
    public ResponseEntity<Map<String, String>> uploadDocuments(
            @RequestParam("files") MultipartFile[] files) {

        if (files == null || files.length == 0) {
            return ResponseEntity.badRequest().body(Map.of("error", "No files provided."));
        }

        String jobId = ingestionService.startIngestion(files);
        return ResponseEntity.accepted().body(Map.of(
            "jobId", jobId,
            "message", "Processing " + files.length + " document(s). Poll /status/" + jobId + " for updates."
        ));
    }

    // ── Poll job status ────────────────────────────────────────────────────────
    @GetMapping("/upload/status/{jobId}")
    public ResponseEntity<Map<String, Object>> getUploadStatus(@PathVariable String jobId) {
        return ResponseEntity.ok(ingestionService.getJobStatus(jobId));
    }
}
