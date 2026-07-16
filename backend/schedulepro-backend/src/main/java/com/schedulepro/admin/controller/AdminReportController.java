// src/main/java/com/schedulepro/admin/controller/AdminReportController.java
package com.schedulepro.admin.controller;

import com.schedulepro.admin.dto.response.ReportOverviewDTO;
import com.schedulepro.admin.dto.response.ReportResponseDTO;
import com.schedulepro.admin.dto.response.ReportTasksDTO;
import com.schedulepro.admin.dto.response.ReportUserDTO;
import com.schedulepro.admin.service.AdminReportService;
import com.schedulepro.common.response.ApiResponse;
import com.fasterxml.jackson.core.JsonProcessingException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@RestController
@RequestMapping("/api/admin/reports")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
@Slf4j
public class AdminReportController {

    private final AdminReportService adminReportService;

    @GetMapping
    public ResponseEntity<ApiResponse<ReportResponseDTO>> generateReport(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        log.info("GET /api/admin/reports - Generating report from {} to {}", startDate, endDate);
        ReportResponseDTO report = adminReportService.generateReport(startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success("Report generated successfully", report));
    }

    @GetMapping("/export/json")
    public ResponseEntity<String> exportReportAsJson(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) throws JsonProcessingException {

        log.info("GET /api/admin/reports/export/json - Exporting report as JSON");
        String json = adminReportService.exportReportAsJson(startDate, endDate);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set(HttpHeaders.CONTENT_DISPOSITION,
                "attachment; filename=report_" + LocalDate.now().format(DateTimeFormatter.ISO_DATE) + ".json");

        return ResponseEntity.ok()
                .headers(headers)
                .body(json);
    }

    @GetMapping("/export/csv")
    public ResponseEntity<String> exportReportAsCsv(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        log.info("GET /api/admin/reports/export/csv - Exporting report as CSV");
        String csv = adminReportService.exportReportAsCsv(startDate, endDate);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.TEXT_PLAIN);
        headers.set(HttpHeaders.CONTENT_DISPOSITION,
                "attachment; filename=report_" + LocalDate.now().format(DateTimeFormatter.ISO_DATE) + ".csv");

        return ResponseEntity.ok()
                .headers(headers)
                .body(csv);
    }
}