package com.chemistryqb.backend.service;

import com.chemistryqb.backend.model.Question;
import com.chemistryqb.backend.repository.QuestionRepository;
import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class PdfExportService {

    @Autowired private QuestionRepository questionRepository;
    @Autowired private QrCodeGeneratorService qrCodeGeneratorService;

    @Value("${APP_DOMAIN:https://chemistry-qb-engine.vercel.app}")
    private String appDomain;

    /**
     * Generates a question bank PDF for a chapter.
     * Each question gets its own QR code linking to:
     *   - The question's assigned YouTube video (if set), OR
     *   - The teacher's dashboard filtered to that chapter
     */
    public byte[] generateChapterPdf(String chapterName) {
        List<Question> questions = questionRepository.findByChapter(chapterName);

        // Group questions by sub-topic for organized layout
        Map<String, List<Question>> bySubTopic = questions.stream()
            .collect(Collectors.groupingBy(q -> q.getSubTopic() != null ? q.getSubTopic() : "General"));

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4, 50, 50, 60, 60);

        try {
            PdfWriter.getInstance(document, baos);
            document.open();

            // ── Cover header ──────────────────────────────────────────────────
            Font titleFont    = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 20, new java.awt.Color(30, 20, 80));
            Font chapterFont  = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 13, new java.awt.Color(100, 70, 200));
            Font qNumFont     = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, new java.awt.Color(50, 50, 50));
            Font qTextFont    = FontFactory.getFont(FontFactory.HELVETICA, 11);
            Font bloomFont    = FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 9, new java.awt.Color(120, 100, 180));
            Font explainFont  = FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 9, new java.awt.Color(80, 80, 80));
            Font qrLabelFont  = FontFactory.getFont(FontFactory.HELVETICA, 8, new java.awt.Color(120, 120, 120));

            Paragraph header = new Paragraph("CBSE Class 12 Chemistry", FontFactory.getFont(FontFactory.HELVETICA, 10, new java.awt.Color(150, 130, 200)));
            header.setAlignment(Element.ALIGN_CENTER);
            document.add(header);

            Paragraph title = new Paragraph(chapterName + " — Question Bank", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(6f);
            document.add(title);

            Paragraph qCount = new Paragraph(questions.size() + " questions · Powered by Gemini AI", bloomFont);
            qCount.setAlignment(Element.ALIGN_CENTER);
            qCount.setSpacingAfter(20f);
            document.add(qCount);

            // Separator line
            document.add(new Chunk(new com.lowagie.text.pdf.draw.LineSeparator()));
            document.add(Chunk.NEWLINE);

            // ── Questions by sub-topic ─────────────────────────────────────────
            AtomicInteger qNum = new AtomicInteger(1);

            for (Map.Entry<String, List<Question>> entry : bySubTopic.entrySet()) {
                // Sub-topic heading
                Paragraph subTopicHeader = new Paragraph(entry.getKey(), chapterFont);
                subTopicHeader.setSpacingBefore(14f);
                subTopicHeader.setSpacingAfter(6f);
                document.add(subTopicHeader);

                for (Question q : entry.getValue()) {
                    // Question text
                    String bloomLabel = bloomLabel(q.getBloomLevel());
                    Paragraph qPara = new Paragraph(
                        qNum.getAndIncrement() + ".  " + q.getQuestionText(), qNumFont);
                    qPara.setSpacingAfter(3f);
                    document.add(qPara);

                    Paragraph meta = new Paragraph("Bloom's Level " + q.getBloomLevel() + " — " + bloomLabel, bloomFont);
                    meta.setSpacingAfter(3f);
                    document.add(meta);

                    if (q.getExplanation() != null && !q.getExplanation().isBlank()) {
                        Paragraph expl = new Paragraph("Hint: " + q.getExplanation(), explainFont);
                        expl.setSpacingAfter(6f);
                        document.add(expl);
                    }

                    // ── Per-question QR code ───────────────────────────────────
                    // Links to video if available, otherwise to the student solve page
                    String qrTarget = (q.getVideoUrl() != null && !q.getVideoUrl().isBlank())
                        ? q.getVideoUrl()
                        : appDomain + "/solve/" + q.getId();

                    try {
                        byte[] qrBytes = qrCodeGeneratorService.generateQRCodeImage(qrTarget);
                        Image qrImage  = Image.getInstance(qrBytes);
                        qrImage.scaleToFit(72, 72);   // ~2.5cm square
                        qrImage.setAlignment(Element.ALIGN_LEFT);
                        qrImage.setSpacingBefore(4f);
                        qrImage.setSpacingAfter(2f);
                        document.add(qrImage);

                        String qrLabel = q.getVideoUrl() != null
                            ? "Scan to watch the video solution"
                            : "Scan to answer this question online";
                        Paragraph qrLabelPara = new Paragraph(qrLabel, qrLabelFont);
                        qrLabelPara.setSpacingAfter(12f);
                        document.add(qrLabelPara);
                    } catch (Exception e) {
                        System.err.println("QR generation failed for question " + q.getId() + ": " + e.getMessage());
                    }

                    // Thin separator between questions
                    document.add(new Chunk(new com.lowagie.text.pdf.draw.DottedLineSeparator()));
                    document.add(Chunk.NEWLINE);
                }
            }

            document.close();
            return baos.toByteArray();

        } catch (Exception e) {
            throw new RuntimeException("Error generating PDF for chapter: " + chapterName, e);
        }
    }

    private String bloomLabel(Integer level) {
        if (level == null) return "N/A";
        return switch (level) {
            case 1 -> "Remembering";
            case 2 -> "Understanding";
            case 3 -> "Applying";
            case 4 -> "Analyzing";
            case 5 -> "Evaluating";
            case 6 -> "Creating";
            default -> "Level " + level;
        };
    }
}
