package com.chemistryqb.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.List;

@RestController
@RequestMapping("/api/proficiency-map")
public class ProficiencyController {

    @GetMapping
    public ResponseEntity<Map<String, Object>> getProficiencyMap() {
        List<Map<String, Object>> chapters = List.of(
            Map.of("chapter", "Solutions", "depthLevel", 4, "mastery", "High"),
            Map.of("chapter", "Electrochemistry", "depthLevel", 2, "mastery", "Foundation Level"),
            Map.of("chapter", "Chemical Kinetics", "depthLevel", 3, "mastery", "Intermediate")
        );
        return ResponseEntity.ok(Map.of("studentId", "stu_123", "proficiencies", chapters));
    }
}
