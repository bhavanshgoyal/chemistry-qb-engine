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
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

@Service
public class PdfExportService {

    @Autowired private QuestionRepository questionRepository;
    @Autowired private QrCodeGeneratorService qrCodeGeneratorService;

    @Value("${APP_DOMAIN:https://chemistry-qb-engine.vercel.app}")
    private String appDomain;

    /**
     * Generates a question bank PDF for a chapter (or all chapters if blank/"All").
     */
    public byte[] generateChapterPdf(String chapterName) {
        boolean allChapters = chapterName == null || chapterName.isBlank() || chapterName.equalsIgnoreCase("All");
        List<Question> questions = allChapters
                ? questionRepository.findAll()
                : questionRepository.findByChapter(chapterName);
        String heading = allChapters ? "Complete Question Bank" : chapterName;
        return buildPdf(heading, questions);
    }

    /**
     * Generates a question bank PDF for an explicit list of question IDs.
     */
    public byte[] generatePdfForIds(List<Long> ids) {
        List<Question> questions = questionRepository.findAllById(ids);
        String heading = "Selected Questions (" + questions.size() + ")";
        return buildPdf(heading, questions);
    }

    private byte[] buildPdf(String titleLabel, List<Question> questions) {
        Map<String, List<Question>> bySubTopic = questions.stream()
            .collect(Collectors.groupingBy(q ->
                q.getSubTopic() != null && !q.getSubTopic().isBlank()
                    ? q.getSubTopic()
                    : (q.getChapter() != null ? q.getChapter() : "General")));

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4, 50, 50, 60, 60);

        try {
            PdfWriter.getInstance(document, baos);
            document.open();

            Font titleFont    = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 20, new java.awt.Color(24, 24, 30));
            Font chapterFont  = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 13, new java.awt.Color(153, 27, 27));
            Font qNumFont     = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, new java.awt.Color(35, 35, 42));
            Font bloomFont    = FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 9, new java.awt.Color(100, 100, 110));
            Font explainFont  = FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 9, new java.awt.Color(80, 80, 88));
            Font qrLabelFont  = FontFactory.getFont(FontFactory.HELVETICA, 8, new java.awt.Color(120, 120, 128));

            Paragraph header = new Paragraph("CBSE Class 12 Chemistry", FontFactory.getFont(FontFactory.HELVETICA, 10, new java.awt.Color(110, 110, 120)));
            header.setAlignment(Element.ALIGN_CENTER);
            document.add(header);

            Paragraph title = new Paragraph(titleLabel + " — Question Bank", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(6f);
            document.add(title);

            Paragraph qCount = new Paragraph(questions.size() + " questions · Printable QR Worksheet", bloomFont);
            qCount.setAlignment(Element.ALIGN_CENTER);
            qCount.setSpacingAfter(20f);
            document.add(qCount);

            document.add(new Chunk(new com.lowagie.text.pdf.draw.LineSeparator()));
            document.add(Chunk.NEWLINE);

            if (questions.isEmpty()) {
                Paragraph empty = new Paragraph("No questions matched the selected filter.", qNumFont);
                empty.setSpacingBefore(16f);
                document.add(empty);
            } else {
                AtomicInteger qNum = new AtomicInteger(1);

                for (Map.Entry<String, List<Question>> entry : bySubTopic.entrySet()) {
                    Paragraph subTopicHeader = new Paragraph(entry.getKey(), chapterFont);
                    subTopicHeader.setSpacingBefore(14f);
                    subTopicHeader.setSpacingAfter(6f);
                    document.add(subTopicHeader);

                    for (Question q : entry.getValue()) {
                        String bloomLabel = bloomLabel(q.getBloomLevel());
                        Paragraph qPara = new Paragraph(
                            qNum.getAndIncrement() + ".  " + q.getQuestionText(), qNumFont);
                        qPara.setSpacingAfter(3f);
                        document.add(qPara);

                        Paragraph meta = new Paragraph(
                            (q.getChapter() != null ? q.getChapter() + " · " : "") +
                            "Bloom's Level " + q.getBloomLevel() + " — " + bloomLabel, bloomFont);
                        meta.setSpacingAfter(3f);
                        document.add(meta);

                        if (q.getExplanation() != null && !q.getExplanation().isBlank()) {
                            Paragraph expl = new Paragraph("Hint: " + q.getExplanation(), explainFont);
                            expl.setSpacingAfter(6f);
                            document.add(expl);
                        }

                        String qrTarget = (q.getVideoUrl() != null && !q.getVideoUrl().isBlank())
                            ? q.getVideoUrl()
                            : appDomain + "/solve/" + q.getId();

                        try {
                            byte[] qrBytes = qrCodeGeneratorService.generateQRCodeImage(qrTarget);
                            Image qrImage  = Image.getInstance(qrBytes);
                            qrImage.scaleToFit(72, 72);
                            qrImage.setAlignment(Element.ALIGN_LEFT);
                            qrImage.setSpacingBefore(4f);
                            qrImage.setSpacingAfter(2f);
                            document.add(qrImage);

                            String qrLabel = q.getVideoUrl() != null && !q.getVideoUrl().isBlank()
                                ? "Scan to watch the video solution"
                                : "Scan to solve this question online";
                            Paragraph qrLabelPara = new Paragraph(qrLabel, qrLabelFont);
                            qrLabelPara.setSpacingAfter(12f);
                            document.add(qrLabelPara);
                        } catch (Exception e) {
                            System.err.println("QR generation failed for question " + q.getId() + ": " + e.getMessage());
                        }

                        document.add(new Chunk(new com.lowagie.text.pdf.draw.DottedLineSeparator()));
                        document.add(Chunk.NEWLINE);
                    }
                }
            }

            document.close();
            return baos.toByteArray();

        } catch (Exception e) {
            throw new RuntimeException("Error generating PDF for: " + titleLabel, e);
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
