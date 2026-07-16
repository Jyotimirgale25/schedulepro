// src/main/java/com/schedulepro/admin/controller/AdminLeaveController.java
package com.schedulepro.admin.controller;

import com.schedulepro.admin.dto.request.LeaveActionRequest;
import com.schedulepro.admin.dto.response.AdminLeaveResponseDTO;
import com.schedulepro.admin.dto.response.LeaveStatsDTO;
import com.schedulepro.admin.service.AdminLeaveService;
import com.schedulepro.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/admin/leaves")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
@Slf4j
public class AdminLeaveController {

    private final AdminLeaveService adminLeaveService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<AdminLeaveResponseDTO>>> getAllLeaves() {
        log.info("GET /api/admin/leaves - Fetching all leave requests");
        List<AdminLeaveResponseDTO> leaves = adminLeaveService.getAllLeaveRequests();
        return ResponseEntity.ok(ApiResponse.success("Leave requests fetched successfully", leaves));
    }

    @GetMapping("/pending")
    public ResponseEntity<ApiResponse<List<AdminLeaveResponseDTO>>> getPendingLeaves() {
        log.info("GET /api/admin/leaves/pending - Fetching pending leave requests");
        List<AdminLeaveResponseDTO> leaves = adminLeaveService.getPendingLeaveRequests();
        return ResponseEntity.ok(ApiResponse.success("Pending leave requests fetched successfully", leaves));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AdminLeaveResponseDTO>> getLeaveById(@PathVariable String id) {
        log.info("GET /api/admin/leaves/{} - Fetching leave request", id);
        AdminLeaveResponseDTO leave = adminLeaveService.getLeaveById(id);
        return ResponseEntity.ok(ApiResponse.success("Leave request fetched successfully", leave));
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<ApiResponse<AdminLeaveResponseDTO>> approveLeave(
            @PathVariable String id,
            @Valid @RequestBody LeaveActionRequest request,
            Authentication authentication) {
        String adminEmail = authentication.getName();
        log.info("PUT /api/admin/leaves/{}/approve - Admin approving leave", id);
        AdminLeaveResponseDTO response = adminLeaveService.approveLeave(id, adminEmail, request);
        return ResponseEntity.ok(ApiResponse.success("Leave request approved successfully", response));
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<ApiResponse<AdminLeaveResponseDTO>> rejectLeave(
            @PathVariable String id,
            @Valid @RequestBody LeaveActionRequest request,
            Authentication authentication) {
        String adminEmail = authentication.getName();
        log.info("PUT /api/admin/leaves/{}/reject - Admin rejecting leave", id);
        AdminLeaveResponseDTO response = adminLeaveService.rejectLeave(id, adminEmail, request);
        return ResponseEntity.ok(ApiResponse.success("Leave request rejected successfully", response));
    }

    @DeleteMapping("/all")
    public ResponseEntity<ApiResponse<Void>> deleteAllLeaves() {
        log.info("DELETE /api/admin/leaves/all - Deleting all leave requests");
        adminLeaveService.deleteAllLeaveRequests();
        return ResponseEntity.ok(ApiResponse.success("All leave requests cleared successfully"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteLeave(@PathVariable String id) {
        log.info("DELETE /api/admin/leaves/{} - Deleting leave request", id);
        adminLeaveService.deleteLeaveRequest(id);
        return ResponseEntity.ok(ApiResponse.success("Leave request deleted successfully"));
    }

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<LeaveStatsDTO>> getLeaveStats() {
        log.info("GET /api/admin/leaves/stats - Fetching leave statistics");
        LeaveStatsDTO stats = adminLeaveService.getLeaveStats();
        return ResponseEntity.ok(ApiResponse.success("Leave statistics fetched successfully", stats));
    }
}