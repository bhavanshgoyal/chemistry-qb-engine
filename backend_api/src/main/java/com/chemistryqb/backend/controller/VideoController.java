package com.chemistryqb.backend.controller;

import com.chemistryqb.backend.model.VideoResource;
import com.chemistryqb.backend.repository.VideoResourceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST API for the teacher's YouTube video library.
 * Videos are tagged by chapter + topic + bloom level and auto-link to matching questions.
 */
@RestController
@RequestMapping("/api/videos")
public class VideoController {

    @Autowired private VideoResourceRepository videoRepo;

    // ── List all videos ───────────────────────────────────────────────────────
    @GetMapping
    public ResponseEntity<List<VideoResource>> getAllVideos() {
        return ResponseEntity.ok(videoRepo.findAll());
    }

    // ── Get videos for a specific chapter ────────────────────────────────────
    @GetMapping("/chapter/{chapter}")
    public ResponseEntity<List<VideoResource>> getByChapter(@PathVariable String chapter) {
        return ResponseEntity.ok(videoRepo.findByChapter(chapter));
    }

    // ── Find best matching video for a question ───────────────────────────────
    @GetMapping("/match")
    public ResponseEntity<VideoResource> findMatch(
            @RequestParam String chapter,
            @RequestParam(required = false) String topic,
            @RequestParam(required = false) Integer bloomLevel) {
        return videoRepo.findBestMatch(chapter, topic != null ? topic : "", bloomLevel)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    // ── Create a new video resource ───────────────────────────────────────────
    @PostMapping
    public ResponseEntity<?> createVideo(@RequestBody VideoResource video) {
        // Validate YouTube URL
        String url = video.getYoutubeUrl();
        if (url == null || url.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "youtubeUrl is required."));
        }
        if (!url.contains("youtube.com/watch?v=") && !url.contains("youtu.be/")) {
            return ResponseEntity.badRequest().body(Map.of("error",
                "Must be a valid YouTube URL (youtube.com/watch?v=... or youtu.be/...)"));
        }
        return ResponseEntity.ok(videoRepo.save(video));
    }

    // ── Update a video resource ───────────────────────────────────────────────
    @PutMapping("/{id}")
    public ResponseEntity<?> updateVideo(@PathVariable Long id, @RequestBody VideoResource updated) {
        return videoRepo.findById(id).map(existing -> {
            existing.setYoutubeUrl(updated.getYoutubeUrl());
            existing.setTitle(updated.getTitle());
            existing.setDescription(updated.getDescription());
            existing.setChapter(updated.getChapter());
            existing.setTopic(updated.getTopic());
            existing.setSubTopic(updated.getSubTopic());
            existing.setBloomLevel(updated.getBloomLevel());
            return ResponseEntity.ok(videoRepo.save(existing));
        }).orElse(ResponseEntity.notFound().build());
    }

    // ── Delete a video resource ───────────────────────────────────────────────
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteVideo(@PathVariable Long id) {
        if (!videoRepo.existsById(id)) return ResponseEntity.notFound().build();
        videoRepo.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
