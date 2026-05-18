package com.chemistryqb.backend.service;

import com.chemistryqb.backend.model.IngestionChunk;
import com.chemistryqb.backend.model.IngestionDocument;
import com.chemistryqb.backend.model.Question;
import com.chemistryqb.backend.repository.IngestionChunkRepository;
import com.chemistryqb.backend.repository.IngestionDocumentRepository;
import com.chemistryqb.backend.repository.QuestionRepository;
import com.chemistryqb.backend.repository.VideoResourceRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AsyncIngestionRunner {

    @Autowired private QuestionRepository questionRepository;
    @Autowired private VideoResourceRepository videoResourceRepository;
    @Autowired private IngestionDocumentRepository documentRepository;
    @Autowired private IngestionChunkRepository chunkRepository;

    @Value("${gemini.api.key}")
    private String geminiApiKey;

    @Value("${gemini.model:gemini-2.5-flash}")
    private String geminiModel;

    @Value("${ingestion.chunk.max-chars:7000}")
    private int maxChunkChars;

    @Value("${ingestion.chunk.delay-ms:2500}")
    private long chunkDelayMs;

    @Value("${ingestion.chunk.max-questions:8}")
    private int maxQuestionsPerChunk;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final RestTemplate restTemplate = new RestTemplate();
    private String syllabusJson = "{}";

    private ConcurrentHashMap<String, Map<String, Object>> jobStatus;

    public void setJobStatus(ConcurrentHashMap<String, Map<String, Object>> jobStatus) {
        this.jobStatus = jobStatus;
    }

    @PostConstruct
    private void loadSyllabus() {
        try (InputStream in = new ClassPathResource("cbse_class12_syllabus_2026.json").getInputStream()) {
            syllabusJson = new String(in.readAllBytes(), StandardCharsets.UTF_8);
        } catch (Exception e) {
            syllabusJson = """
                    {
                      "subject": "Chemistry",
                      "grade": 12,
                      "active_chapters": [
                        "Solutions", "Electrochemistry", "Chemical Kinetics",
                        "d and f Block Elements", "Coordination Compounds",
                        "Haloalkanes and Haloarenes", "Alcohols, Phenols and Ethers",
                        "Aldehydes, Ketones and Carboxylic Acids", "Amines", "Biomolecules"
                      ]
                    }
                    """;
        }
    }

    @Async
    public void processFilesAsync(String jobId, List<FileData> files) {
        if (files == null || files.isEmpty()) {
            putStatus(jobId, "failed", "No readable files were received.", 0, 0, 0, 0);
            return;
        }

        int totalSaved = 0;
        for (FileData file : files) {
            IngestionDocument document = createDocument(jobId, file.filename());

            try {
                updateDocument(document, "extracting", "Extracting readable text from " + file.filename(), 0, 0, 0, 0, null);
                putStatus(jobId, "processing", "Extracting readable text from " + file.filename() + "...", totalSaved, 0, 0, 0);

                String text = extractText(file);
                if (text == null || text.isBlank()) {
                    String message = file.filename() + ": no selectable text found. This looks like a scanned/image-only PDF and needs OCR before AI generation.";
                    updateDocument(document, "failed", message, 0, 0, 1, 0, null);
                    putStatus(jobId, "completed_with_errors", message, totalSaved, 0, 0, 1);
                    continue;
                }

                List<String> chunks = splitText(text);
                saveDocumentChunks(document, text, chunks);

                putStatus(jobId, "processing",
                        "Stored " + file.filename() + " as " + chunks.size() + " small AI chunk(s). Starting slow generation...",
                        totalSaved, chunks.size(), 0, 0);

                totalSaved += processPendingChunks(jobId);
            } catch (Exception e) {
                String message = file.filename() + ": " + e.getMessage();
                updateDocument(document, "failed", message, 0, 0, 1, 0, null);
                putStatus(jobId, "completed_with_errors", message, totalSaved, 0, 0, 1);
            }
        }

        finishJob(jobId);
    }

    private IngestionDocument createDocument(String jobId, String filename) {
        IngestionDocument document = new IngestionDocument();
        document.setId(UUID.randomUUID().toString());
        document.setJobId(jobId);
        document.setOriginalFilename(filename);
        document.setStatus("queued");
        document.setMessage("Waiting to extract text.");
        document.setTotalChunks(0);
        document.setCompletedChunks(0);
        document.setFailedChunks(0);
        document.setTotalSaved(0);
        return documentRepository.save(document);
    }

    private void saveDocumentChunks(IngestionDocument document, String extractedText, List<String> chunks) {
        List<IngestionChunk> entities = new ArrayList<>();
        for (int i = 0; i < chunks.size(); i++) {
            IngestionChunk chunk = new IngestionChunk();
            chunk.setJobId(document.getJobId());
            chunk.setDocumentId(document.getId());
            chunk.setOriginalFilename(document.getOriginalFilename());
            chunk.setChunkIndex(i + 1);
            chunk.setTotalChunks(chunks.size());
            chunk.setStatus("pending");
            chunk.setGeneratedCount(0);
            chunk.setChunkText(chunks.get(i));
            entities.add(chunk);
        }
        chunkRepository.saveAll(entities);

        updateDocument(document, "queued", "Text stored. Waiting for AI generation.", chunks.size(), 0, 0, 0, extractedText);
    }

    private int processPendingChunks(String jobId) {
        int savedInThisRun = 0;
        List<IngestionChunk> chunks = chunkRepository.findByJobIdAndStatusInOrderByIdAsc(jobId, List.of("pending", "processing"));

        for (int i = 0; i < chunks.size(); i++) {
            IngestionChunk chunk = chunks.get(i);
            try {
                chunk.setStatus("processing");
                chunk.setErrorMessage(null);
                chunkRepository.save(chunk);
                refreshDocumentProgress(chunk.getDocumentId(), "processing", "Generating questions chunk by chunk...");

                putStatus(jobId, "processing",
                        "Gemini is processing " + chunk.getOriginalFilename() + " chunk " + chunk.getChunkIndex() + " of " + chunk.getTotalChunks() + "...",
                        currentSaved(jobId), totalChunks(jobId), completedChunks(jobId), failedChunks(jobId));

                List<Map<String, Object>> extracted = analyzeWithGemini(chunk.getChunkText(), chunk.getChunkIndex(), chunk.getTotalChunks());
                int saved = saveQuestions(extracted);
                savedInThisRun += saved;

                chunk.setStatus("completed");
                chunk.setGeneratedCount(saved);
                chunkRepository.save(chunk);
                refreshDocumentProgress(chunk.getDocumentId(), null, null);

                putStatus(jobId, "processing",
                        "Saved " + saved + " question(s) from chunk " + chunk.getChunkIndex() + " of " + chunk.getTotalChunks() + ".",
                        currentSaved(jobId), totalChunks(jobId), completedChunks(jobId), failedChunks(jobId));
            } catch (Exception e) {
                chunk.setStatus("failed");
                chunk.setGeneratedCount(0);
                chunk.setErrorMessage(e.getMessage());
                chunkRepository.save(chunk);
                refreshDocumentProgress(chunk.getDocumentId(), null, null);

                putStatus(jobId, "processing",
                        "Chunk " + chunk.getChunkIndex() + " failed: " + e.getMessage(),
                        currentSaved(jobId), totalChunks(jobId), completedChunks(jobId), failedChunks(jobId));
            }

            if (i < chunks.size() - 1) {
                pauseBeforeNextChunk();
            }
        }
        return savedInThisRun;
    }

    private String extractText(FileData file) throws Exception {
        String filename = Objects.requireNonNullElse(file.filename(), "upload").toLowerCase();
        if (filename.endsWith(".txt")) {
            return new String(file.bytes(), StandardCharsets.UTF_8);
        }

        try (PDDocument doc = org.apache.pdfbox.Loader.loadPDF(file.bytes())) {
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(doc);
        }
    }

    private List<String> splitText(String text) {
        String normalized = text
                .replace("\r\n", "\n")
                .replace('\r', '\n')
                .replaceAll("[ \\t]+", " ")
                .trim();

        List<String> chunks = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        String[] paragraphs = normalized.split("\\n\\s*\\n");

        for (String rawParagraph : paragraphs) {
            String paragraph = rawParagraph.trim();
            if (paragraph.isBlank()) {
                continue;
            }

            if (paragraph.length() > maxChunkChars) {
                flushChunk(current, chunks);
                splitLongParagraph(paragraph, chunks);
                continue;
            }

            if (current.length() + paragraph.length() + 2 > maxChunkChars) {
                flushChunk(current, chunks);
            }

            if (!current.isEmpty()) {
                current.append("\n\n");
            }
            current.append(paragraph);
        }

        flushChunk(current, chunks);
        return chunks.isEmpty() ? List.of(normalized) : chunks;
    }

    private void splitLongParagraph(String paragraph, List<String> chunks) {
        int start = 0;
        while (start < paragraph.length()) {
            int end = Math.min(start + maxChunkChars, paragraph.length());
            int breakAt = findNaturalBreak(paragraph, start, end);
            chunks.add(paragraph.substring(start, breakAt).trim());
            start = breakAt;
        }
    }

    private int findNaturalBreak(String text, int start, int end) {
        int earliest = start + Math.max(500, (int) (maxChunkChars * 0.55));
        for (int i = end - 1; i > earliest; i--) {
            char ch = text.charAt(i);
            if (ch == '.' || ch == '?' || ch == '!' || ch == ';' || ch == '\n') {
                return i + 1;
            }
        }
        return end;
    }

    private void flushChunk(StringBuilder current, List<String> chunks) {
        if (!current.isEmpty()) {
            chunks.add(current.toString().trim());
            current.setLength(0);
        }
    }

    private List<Map<String, Object>> analyzeWithGemini(String chunkText, int chunkIndex, int totalChunks) throws Exception {
        if (geminiApiKey == null || geminiApiKey.isBlank()) {
            throw new IllegalStateException("GEMINI_API_KEY is missing.");
        }

        String prompt = """
                You are a meticulous CBSE Class 12 Chemistry question-bank generator.

                Work only on the CURRENT TEXT CHUNK. Do not invent facts, chapters, or questions from outside this chunk.
                The full document is being processed slowly in many small chunks, so quality matters more than quantity.

                CBSE SYLLABUS MAP:
                %s

                CURRENT CHUNK: %d of %d

                TASK:
                Generate at most %d high-quality questions from this chunk.
                Use only active CBSE Class 12 Chemistry chapters and sub-topics from the syllabus map.
                If the chunk is irrelevant, repeated boilerplate, or too thin for chemistry questions, return [].

                For each useful question, return:
                {
                  "topic": "<chapter name from the syllabus>",
                  "sub_topic": "<specific sub-topic>",
                  "bloom_level": <integer 1-6>,
                  "question_text": "<clear question; wrap formulas and variables in inline LaTeX>",
                  "explanation": "<concise but complete answer/rationale>"
                }

                Bloom guide:
                1 Remembering, 2 Understanding, 3 Applying, 4 Analyzing, 5 Evaluating, 6 Creating.

                Return ONLY a raw JSON array. No markdown fences. No intro text.

                CURRENT TEXT CHUNK:
                %s
                """.formatted(syllabusJson, chunkIndex, totalChunks, maxQuestionsPerChunk, chunkText);

        String url = "https://generativelanguage.googleapis.com/v1beta/models/"
                + geminiModel + ":generateContent?key=" + geminiApiKey;

        Map<String, Object> body = Map.of(
                "contents", List.of(Map.of("parts", List.of(Map.of("text", prompt)))),
                "generationConfig", Map.of(
                        "temperature", 0.15,
                        "maxOutputTokens", 8192,
                        "responseMimeType", "application/json"
                )
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        ResponseEntity<String> response = restTemplate.postForEntity(url, new HttpEntity<>(body, headers), String.class);
        return parseGeminiResponse(response.getBody());
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> parseGeminiResponse(String rawBody) throws Exception {
        if (rawBody == null || rawBody.isBlank()) {
            throw new IllegalArgumentException("Gemini returned an empty response.");
        }

        Map<String, Object> resp = objectMapper.readValue(rawBody, new TypeReference<>() {});
        List<Map<String, Object>> candidates = (List<Map<String, Object>>) resp.get("candidates");
        if (candidates == null || candidates.isEmpty()) {
            throw new IllegalArgumentException("Gemini returned no candidates.");
        }

        Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
        List<Map<String, Object>> parts = content == null ? null : (List<Map<String, Object>>) content.get("parts");
        if (parts == null || parts.isEmpty()) {
            throw new IllegalArgumentException("Gemini returned no content parts.");
        }

        String text = String.valueOf(parts.get(0).get("text")).strip();
        if (text.startsWith("```json")) {
            text = text.substring(7);
        }
        if (text.startsWith("```")) {
            text = text.substring(3);
        }
        if (text.endsWith("```")) {
            text = text.substring(0, text.length() - 3);
        }

        Object parsed = objectMapper.readValue(text.strip(), Object.class);
        if (parsed instanceof List<?> list) {
            return objectMapper.convertValue(list, new TypeReference<>() {});
        }
        if (parsed instanceof Map<?, ?> map) {
            Object questions = map.get("questions");
            if (questions instanceof List<?> questionList) {
                return objectMapper.convertValue(questionList, new TypeReference<>() {});
            }
            if ("OUTDATED".equals(map.get("status"))) {
                return List.of((Map<String, Object>) parsed);
            }
        }

        throw new IllegalArgumentException("Gemini returned JSON, but not a question array.");
    }

    private int saveQuestions(List<Map<String, Object>> extracted) {
        if (extracted == null || extracted.isEmpty()) {
            return 0;
        }

        int count = 0;
        Set<String> seenThisChunk = new HashSet<>();
        for (Map<String, Object> item : extracted) {
            if ("OUTDATED".equals(item.get("status"))) {
                continue;
            }

            Question q = new Question();
            q.setChapter(str(item, "topic"));
            q.setTopic(str(item, "sub_topic"));
            q.setSubTopic(str(item, "sub_topic"));
            q.setBloomLevel(intVal(item, "bloom_level"));
            q.setQuestionText(str(item, "question_text"));
            q.setExplanation(str(item, "explanation"));

            if (!isValidQuestion(q)) {
                continue;
            }

            String normalizedQuestion = q.getQuestionText().trim().replaceAll("\\s+", " ").toLowerCase();
            if (!seenThisChunk.add(normalizedQuestion) || questionRepository.existsByQuestionText(q.getQuestionText())) {
                continue;
            }

            videoResourceRepository
                    .findBestMatch(q.getChapter(), q.getTopic(), q.getBloomLevel())
                    .ifPresent(v -> q.setVideoUrl(v.getYoutubeUrl()));

            questionRepository.save(q);
            count++;
        }
        return count;
    }

    private boolean isValidQuestion(Question q) {
        return q.getChapter() != null && !q.getChapter().isBlank()
                && q.getTopic() != null && !q.getTopic().isBlank()
                && q.getBloomLevel() != null && q.getBloomLevel() >= 1 && q.getBloomLevel() <= 6
                && q.getQuestionText() != null && q.getQuestionText().trim().length() >= 20
                && q.getExplanation() != null && q.getExplanation().trim().length() >= 10;
    }

    private String str(Map<String, Object> map, String key) {
        Object val = map.get(key);
        return val == null ? null : val.toString().trim();
    }

    private Integer intVal(Map<String, Object> map, String key) {
        Object val = map.get(key);
        if (val == null) {
            return null;
        }
        if (val instanceof Number n) {
            return n.intValue();
        }
        try {
            return Integer.parseInt(val.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private void refreshDocumentProgress(String documentId, String forcedStatus, String forcedMessage) {
        documentRepository.findById(documentId).ifPresent(document -> {
            List<IngestionChunk> chunks = chunkRepository.findByDocumentIdOrderByIdAsc(documentId);
            int total = chunks.size();
            int completed = (int) chunks.stream().filter(c -> "completed".equals(c.getStatus())).count();
            int failed = (int) chunks.stream().filter(c -> "failed".equals(c.getStatus())).count();
            int saved = chunks.stream()
                    .map(IngestionChunk::getGeneratedCount)
                    .filter(n -> n != null)
                    .mapToInt(Integer::intValue)
                    .sum();

            String status = forcedStatus;
            if (status == null) {
                status = completed + failed >= total
                        ? (failed == 0 ? "completed" : "completed_with_errors")
                        : "processing";
            }

            String message = forcedMessage;
            if (message == null) {
                message = completed + failed >= total
                        ? "Generation finished for this document."
                        : "Generated " + completed + " of " + total + " chunks.";
            }

            updateDocument(document, status, message, total, completed, failed, saved, null);
        });
    }

    private void updateDocument(IngestionDocument document, String status, String message, int totalChunks,
                                int completedChunks, int failedChunks, int totalSaved, String extractedText) {
        document.setStatus(status);
        document.setMessage(message);
        document.setTotalChunks(totalChunks);
        document.setCompletedChunks(completedChunks);
        document.setFailedChunks(failedChunks);
        document.setTotalSaved(totalSaved);
        if (extractedText != null) {
            document.setExtractedText(extractedText);
        }
        documentRepository.save(document);
    }

    private void finishJob(String jobId) {
        int total = totalChunks(jobId);
        int completed = completedChunks(jobId);
        int failed = failedChunks(jobId);
        int saved = currentSaved(jobId);
        int failedDocuments = (int) documentRepository.findByJobId(jobId).stream()
                .filter(d -> "failed".equals(d.getStatus()))
                .count();

        String status;
        String message;
        if (total == 0 && failedDocuments > 0) {
            status = "failed";
            message = "No questions were generated. The upload may need OCR or cleaner source text.";
        } else if (completed + failed >= total) {
            status = failed == 0 && failedDocuments == 0 ? "completed" : "completed_with_errors";
            message = failed == 0 && failedDocuments == 0
                    ? "Slow generation complete. Saved " + saved + " question(s)."
                    : "Slow generation finished with " + failed + " failed chunk(s) and " + failedDocuments + " failed document(s). Saved " + saved + " question(s).";
        } else {
            status = "processing";
            message = "Generation is still running...";
        }

        putStatus(jobId, status, message, saved, total, completed, failed);
    }

    private int currentSaved(String jobId) {
        return chunkRepository.findByJobIdOrderByIdAsc(jobId).stream()
                .map(IngestionChunk::getGeneratedCount)
                .filter(n -> n != null)
                .mapToInt(Integer::intValue)
                .sum();
    }

    private int totalChunks(String jobId) {
        return chunkRepository.findByJobIdOrderByIdAsc(jobId).size();
    }

    private int completedChunks(String jobId) {
        return (int) chunkRepository.findByJobIdOrderByIdAsc(jobId).stream()
                .filter(c -> "completed".equals(c.getStatus()))
                .count();
    }

    private int failedChunks(String jobId) {
        return (int) chunkRepository.findByJobIdOrderByIdAsc(jobId).stream()
                .filter(c -> "failed".equals(c.getStatus()))
                .count();
    }

    private void putStatus(String jobId, String status, String message, int totalSaved,
                           int totalChunks, int completedChunks, int failedChunks) {
        if (jobStatus == null) {
            return;
        }

        Map<String, Object> s = new HashMap<>();
        s.put("status", status);
        s.put("message", message);
        s.put("totalSaved", totalSaved);
        s.put("totalChunks", totalChunks);
        s.put("completedChunks", completedChunks);
        s.put("failedChunks", failedChunks);
        jobStatus.put(jobId, s);
    }

    private void pauseBeforeNextChunk() {
        if (chunkDelayMs <= 0) {
            return;
        }
        try {
            Thread.sleep(chunkDelayMs);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    public record FileData(String filename, String contentType, byte[] bytes) {
    }
}
