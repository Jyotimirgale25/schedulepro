// src/main/java/com/schedulepro/manager/controller/ReportController.java
package com.schedulepro.manager.controller;

import com.schedulepro.manager.dto.response.ReportDTO;
import com.schedulepro.manager.service.ReportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/manager/reports")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasRole('MANAGER') or hasRole('ADMIN')")
public class ReportController {

    private final ReportService reportService;

    @GetMapping
    public ResponseEntity<ReportDTO> generateReport(
            @RequestParam(defaultValue = "monthly") String period) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        log.info("📊 Generating report for manager: {}, period: {}", email, period);
        ReportDTO report = reportService.generateReport(email, period);
        return ResponseEntity.ok(report);
    }

    @GetMapping("/export/csv")
    public ResponseEntity<String> exportCsv(
            @RequestParam(defaultValue = "monthly") String period) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        log.info("📊 Exporting CSV report for manager: {}, period: {}", email, period);

        ReportDTO report = reportService.generateReport(email, period);
        String csv = reportService.exportReportToCsv(report);

        HttpHeaders headers = new HttpHeaders();
        headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=report_" + period + ".csv");
        headers.add(HttpHeaders.CONTENT_TYPE, MediaType.TEXT_PLAIN_VALUE);

        return ResponseEntity.ok()
                .headers(headers)
                .body(csv);
    }
}