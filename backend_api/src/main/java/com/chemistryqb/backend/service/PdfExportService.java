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

@Service
public class PdfExportService {

    @Autowired
    private QuestionRepository questionRepository;

    @Autowired
    private QrCodeGeneratorService qrCodeGeneratorService;

    @Value("${APP_DOMAIN:http://localhost:8080}")
    private String appDomain;

    public byte[] generateChapterPdf(String chapterName) {
        List<Question> questions = questionRepository.findByChapter(chapterName);
        
        Map<String, List<Question>> questionsBySubTopic = questions.stream()
                .collect(Collectors.groupingBy(q -> q.getTopic() != null ? q.getTopic() : "General"));

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        Document document = new Document();
        
        try {
            PdfWriter.getInstance(document, baos);
            document.open();

            // Title
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18);
            Paragraph title = new Paragraph(chapterName + " - CBSE Class 12 Question Bank", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(20f);
            document.add(title);

            // Questions Grouped by Sub Topic
            Font subTopicFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14);
            Font questionFont = FontFactory.getFont(FontFactory.HELVETICA, 12);

            for (Map.Entry<String, List<Question>> entry : questionsBySubTopic.entrySet()) {
                Paragraph subTopicHeader = new Paragraph(entry.getKey(), subTopicFont);
                subTopicHeader.setSpacingBefore(10f);
                subTopicHeader.setSpacingAfter(5f);
                document.add(subTopicHeader);

                for (Question q : entry.getValue()) {
                    String qText = String.format("Q%d. %s (Bloom's Level: %d)", q.getId() != null ? q.getId() : 0, q.getQuestionText(), q.getBloomLevel());
                    Paragraph qParagraph = new Paragraph(qText, questionFont);
                    qParagraph.setSpacingAfter(5f);
                    document.add(qParagraph);
                }
            }

            // QR Code Footer
            String trackingUrl = appDomain + "/dashboard?chapter=" + chapterName;
            byte[] qrBytes = qrCodeGeneratorService.generateQRCodeImage(trackingUrl);
            Image qrImage = Image.getInstance(qrBytes);
            qrImage.setAlignment(Element.ALIGN_CENTER);
            qrImage.setSpacingBefore(30f);
            document.add(qrImage);

            Paragraph footerText = new Paragraph("Scan to input answers and update your Mastery Matrix.", FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 10));
            footerText.setAlignment(Element.ALIGN_CENTER);
            document.add(footerText);

            document.close();
            return baos.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Error generating PDF", e);
        }
    }
}
