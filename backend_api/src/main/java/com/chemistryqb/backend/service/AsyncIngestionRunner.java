package com.chemistryqb.backend.service;

import com.chemistryqb.backend.model.Question;
import com.chemistryqb.backend.repository.QuestionRepository;
import com.chemistryqb.backend.repository.VideoResourceRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AsyncIngestionRunner {

    @Autowired
    private QuestionRepository questionRepository;
    @Autowired
    private VideoResourceRepository videoResourceRepository;
    @Value("${gemini.api.key}")
    private String geminiApiKey;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final RestTemplate restTemplate = new RestTemplate();

    private ConcurrentHashMap<String, Map<String, Object>> jobStatus;

    public void setJobStatus(ConcurrentHashMap<String, Map<String, Object>> jobStatus) {
        this.jobStatus = jobStatus;
    }

    // FIX A: Accept the List of FileData (memory bytes) instead of MultipartFile
    @Async
    public void processFilesAsync(String jobId, List<FileData> files) {
        int totalSaved = 0;
        List<String> errors = new ArrayList<>();

        // FIX B: Update loop to use FileData and .filename()
        for (FileData file : files) {
            try {
                updateStatus(jobId, "processing", "Extracting text from: " + file.filename(), 0);
                String text = extractText(file);

                if (text == null || text.isBlank()) {
                    errors.add(file.filename() + ": no text could be extracted");
                    continue;
                }

                updateStatus(jobId, "processing", "Calling Gemini AI for: " + file.filename(), 0);
                List<Map<String, Object>> extracted = analyzeWithGemini(text);

                if (extracted == null) {
                    errors.add(file.filename() + ": Gemini returned no parseable data");
                    continue;
                }

                int saved = saveQuestions(extracted);
                totalSaved += saved;
                updateStatus(jobId, "processing", "Saved " + saved + " questions from " + file.filename(), totalSaved);

            } catch (Exception e) {
                errors.add(file.filename() + ": " + e.getMessage());
            }
        }

        // Final status
        if (errors.isEmpty()) {
            Map<String, Object> result = new HashMap<>();
            result.put("status", "completed");
            result.put("message",
                    "Successfully extracted " + totalSaved + " questions from " + files.size() + " document(s).");
            result.put("totalSaved", totalSaved);
            jobStatus.put(jobId, result);
        } else {
            Map<String, Object> result = new HashMap<>();
            result.put("status", errors.size() == files.size() ? "failed" : "completed_with_errors");
            result.put("message", "Saved " + totalSaved + " questions. Errors: " + String.join("; ", errors));
            result.put("totalSaved", totalSaved);
            result.put("errors", errors);
            jobStatus.put(jobId, result);
        }
    }

    // FIX C: Extract text directly from the memory bytes
    private String extractText(FileData file) throws Exception {
        String filename = Objects.requireNonNull(file.filename()).toLowerCase();
        if (filename.endsWith(".txt")) {
            return new String(file.bytes(), StandardCharsets.UTF_8);
        }

        try (PDDocument doc = org.apache.pdfbox.Loader.loadPDF(file.bytes())) {
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(doc);
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Optimized Gemini AI Call (Anti-Laziness + Strict JSON Mode)
    // ──────────────────────────────────────────────────────────────────────────

    private List<Map<String, Object>> analyzeWithGemini(String text) {
        // Keep up to 30k characters for analysis
        String truncated = text.length() > 30000 ? text.substring(0, 30000) : text;

        String prompt = """
                You are an elite, highly meticulous CBSE Class 12 Chemistry educator and automated data extraction engine.

                [CRITICAL TASK]
                Analyze the provided text exhaustively. Your goal is to construct a comprehensive, deep Question Bank.
                Do not skim. Do not summarize. Do not cut corners or stop early. Extract as many valid chemistry questions as the text supports.

                [COMPREHENSIVE COVERAGE MANDATE]
                For the extracted topics, you MUST generate and sort questions across all 6 layers of Bloom's Taxonomy:
                1. Remembering (Definitions, basic formulas)
                2. Understanding (Explaining trends, mechanisms, reasoning)
                3. Applying (Solving numerical problems, calculating values)
                4. Analyzing (Differentiating components, interpreting graphs/data tables)
                5. Evaluating (Justifying a choice, assessing chemical behavior)
                6. Creating (Synthesizing a concept layout or complex open-ended scenario)

                Ensure you produce a balanced mix of these levels from the source text.

                [OUTPUT FORMAT]
                You must return a raw JSON array. Each object in the array must match this exact schema:
                {
                  "topic": "<Exact CBSE Chapter name, e.g., Solutions, Electrochemistry, Chemical Kinetics, Coordination Compounds, Biomolecules>",
                  "sub_topic": "<Specific topic or law, e.g., Nernst Equation, Raoult's Law>",
                  "bloom_level": <Integer from 1 to 6>,
                  "question_text": "<Clear question. Use standard text or markdown, and ALWAYS wrap chemical formulas or mathematical variables in inline LaTeX like $H_2SO_4$ or $\\Delta G$>",
                  "explanation": "<Step-by-step complete solution or chemical rationale>"
                }

                If a segment of text is completely irrelevant to the CBSE Class 12 Chemistry syllabus, output exactly:
                { "status": "OUTDATED" }

                [STRICT CONSTRAINT]
                Do not talk to me. Do not provide markdown formatting code fences like ```json. Do not include introductory text like "Here is your JSON". Output ONLY the valid raw JSON array object.

                TEXT TO ENCODE AND SYNTHESIZE:
                """
                + truncated;

        String url = "[https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=](https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=)"
                + geminiApiKey;

        // Upgrade configuration to use responseMimeType
        Map<String, Object> body = Map.of(
                "contents", List.of(Map.of("parts", List.of(Map.of("text", prompt)))),
                "generationConfig", Map.of(
                        "temperature", 0.15,
                        "maxOutputTokens", 8192,
                        "responseMimeType", "application/json" // <-- FORCES GEMINI INTO STRICT JSON MODE
                ));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(url, new HttpEntity<>(body, headers),
                    String.class);
            return parseGeminiResponse(response.getBody());
        } catch (Exception e) {
            System.err.println("Gemini API error: " + e.getMessage());
            return null;
        }
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> parseGeminiResponse(String rawBody) {
        // FIX D: Print exactly what Gemini says to the Render Logs!
        System.out.println("========== GEMINI RAW RESPONSE ==========");
        System.out.println(rawBody);
        System.out.println("=========================================");

        try {
            Map<String, Object> resp = objectMapper.readValue(rawBody, new TypeReference<>() {
            });
            List<Map<String, Object>> candidates = (List<Map<String, Object>>) resp.get("candidates");
            Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
            List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
            String text = (String) parts.get(0).get("text");

            text = text.strip();
            if (text.startsWith("```json"))
                text = text.substring(7);
            if (text.startsWith("```"))
                text = text.substring(3);
            if (text.endsWith("```"))
                text = text.substring(0, text.length() - 3);

            return objectMapper.readValue(text.strip(), new TypeReference<>() {
            });
        } catch (Exception e) {
            System.err.println("Failed to parse Gemini response: " + e.getMessage());
            return null;
        }
    }

    private int saveQuestions(List<Map<String, Object>> extracted) {
        int count = 0;
        for (Map<String, Object> item : extracted) {
            if ("OUTDATED".equals(item.get("status")))
                continue;
            try {
                Question q = new Question();
                q.setChapter(str(item, "topic"));
                q.setTopic(str(item, "sub_topic"));
                q.setSubTopic(str(item, "sub_topic"));
                q.setBloomLevel(intVal(item, "bloom_level"));
                q.setQuestionText(str(item, "question_text"));
                q.setExplanation(str(item, "explanation"));

                videoResourceRepository
                        .findBestMatch(q.getChapter(), q.getTopic(), q.getBloomLevel())
                        .ifPresent(v -> q.setVideoUrl(v.getYoutubeUrl()));

                questionRepository.save(q);
                count++;
            } catch (Exception e) {
                System.err.println("Failed to save question: " + e.getMessage());
            }
        }
        return count;
    }

    private String str(Map<String, Object> map, String key) {
        Object val = map.get(key);
        return val == null ? null : val.toString();
    }

    private Integer intVal(Map<String, Object> map, String key) {
        Object val = map.get(key);
        if (val == null)
            return null;
        if (val instanceof Integer i)
            return i;
        try {
            return Integer.parseInt(val.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private void updateStatus(String jobId, String status, String message, int saved) {
        Map<String, Object> s = new HashMap<>();
        s.put("status", status);
        s.put("message", message);
        s.put("totalSaved", saved);
        jobStatus.put(jobId, s);
    }

    // FIX E: The new record that holds the file bytes in memory
    public record FileData(String filename, byte[] bytes) {
    }
}