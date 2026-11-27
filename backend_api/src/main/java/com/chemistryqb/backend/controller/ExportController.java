package com.chemistryqb.backend.controller;

import com.chemistryqb.backend.service.PdfExportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/export")
public class ExportController {

    @Autowired
    private PdfExportService pdfExportService;

    @GetMapping("/pdf")
    public ResponseEntity<byte[]> exportChapterPdf(
            @RequestParam(value = "chapter", required = false) String chapter,
            @RequestParam(value = "ids", required = false) List<Long> ids) {

        byte[] pdfBytes = (ids != null && !ids.isEmpty())
                ? pdfExportService.generatePdfForIds(ids)
                : pdfExportService.generateChapterPdf(chapter);

        String safeTitle = (ids != null && !ids.isEmpty())
                ? "Selected_Questions"
                : (chapter == null || chapter.isBlank() || chapter.equalsIgnoreCase("All"))
                    ? "All_Chapters"
                    : chapter.replaceAll("[^a-zA-Z0-9_-]", "_");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", safeTitle + "_QuestionBank.pdf");

        return ResponseEntity.ok()
                .headers(headers)
                .body(pdfBytes);
    }
}
