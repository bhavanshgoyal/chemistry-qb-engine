package com.chemistryqb.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpEntity;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import java.util.Map;
import java.util.List;

@Service
public class QuestionGeneratorService {

    @Value("${gemini.api.key}")
    private String apiKey;

    public String generateBridgeQuestion(String topicA, String topicB) {
        String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=" + apiKey;
        RestTemplate restTemplate = new RestTemplate();

        String promptText = String.format("Generate a single Bloom's Level 5 (Evaluate) chemistry question that combines concepts from %s and %s based on the CBSE 2026 syllabus. Include a step-by-step explanation and output in strict JSON format.", topicA, topicB);

        Map<String, Object> requestBody = Map.of(
            "contents", List.of(
                Map.of("parts", List.of(
                    Map.of("text", promptText)
                ))
            )
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);
            return response.getBody();
        } catch (Exception e) {
            return "{\"error\": \"Failed to generate question\", \"details\": \"" + e.getMessage() + "\"}";
        }
    }
}
