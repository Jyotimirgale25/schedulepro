// src/main/java/com/schedulepro/admin/controller/AdminDashboardController.java
package com.schedulepro.admin.controller;

import com.schedulepro.admin.dto.response.AdminDashboardStatsDTO;
import com.schedulepro.admin.service.AdminDashboardService;
import com.schedulepro.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/dashboard")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
@Slf4j
public class AdminDashboardController {

    private final AdminDashboardService adminDashboardService;

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<AdminDashboardStatsDTO>> getDashboardStats() {
        log.info("GET /api/admin/dashboard/stats - Fetching admin dashboard stats");
        AdminDashboardStatsDTO stats = adminDashboardService.getDashboardStats();
        return ResponseEntity.ok(ApiResponse.success("Dashboard stats fetched successfully", stats));
    }
}