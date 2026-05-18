package com.chemistryqb.backend.controller;

import com.chemistryqb.backend.service.QuestionGeneratorService;
import com.chemistryqb.backend.service.ProficiencyAnalysisService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.List;
import com.chemistryqb.backend.model.QuestionAttempt;
import com.chemistryqb.backend.dto.RemediationDTO;
import com.chemistryqb.backend.service.RemediationService;

@RestController
@RequestMapping("/api/generate-bridge")
public class DiagnosticController {

    @Autowired
    private QuestionGeneratorService questionGeneratorService;

    @Autowired
    private ProficiencyAnalysisService proficiencyService;

    @Autowired
    private RemediationService remediationService;

    @GetMapping
    public ResponseEntity<String> generateBridge(@RequestParam("t1") String t1, @RequestParam("t2") String t2) {
        String question = questionGeneratorService.generateBridgeQuestion(t1, t2);
        return ResponseEntity.ok().header("Content-Type", "application/json").body(question);
    }

    @PostMapping("/submit")
    public ResponseEntity<Map<String, Object>> submitAnswer(@RequestBody Map<String, Object> payload) {
        boolean isCorrect = Boolean.TRUE.equals(payload.get("isCorrect"));
        int bloomLevel = payload.get("bloomLevel") instanceof Number n ? n.intValue() : 1;
        String topic = String.valueOf(payload.getOrDefault("topic", "General"));

        String recommendedAction = proficiencyService.determineNextAction(bloomLevel, isCorrect, topic);
        
        return ResponseEntity.ok(Map.of(
            "correct", isCorrect,
            "recommendedAction", recommendedAction
        ));
    }

    @PostMapping("/progress/save")
    public ResponseEntity<RemediationDTO> saveProgress(@RequestBody List<QuestionAttempt> attempts) {
        RemediationDTO remediation = remediationService.getRemediation(attempts);
        return ResponseEntity.ok(remediation);
    }
}
