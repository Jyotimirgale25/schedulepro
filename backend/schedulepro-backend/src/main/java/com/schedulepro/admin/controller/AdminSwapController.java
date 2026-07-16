// src/main/java/com/schedulepro/admin/controller/AdminSwapController.java
package com.schedulepro.admin.controller;

import com.schedulepro.admin.dto.request.SwapActionRequest;
import com.schedulepro.admin.dto.response.AdminSwapResponseDTO;
import com.schedulepro.admin.service.AdminSwapService;
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
@RequestMapping("/api/admin/swaps")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
@Slf4j
public class AdminSwapController {

    private final AdminSwapService adminSwapService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<AdminSwapResponseDTO>>> getAllSwaps() {
        log.info("GET /api/admin/swaps - Fetching all swap requests");
        List<AdminSwapResponseDTO> swaps = adminSwapService.getAllSwapRequests();
        return ResponseEntity.ok(ApiResponse.success("Swap requests fetched successfully", swaps));
    }

    @GetMapping("/pending")
    public ResponseEntity<ApiResponse<List<AdminSwapResponseDTO>>> getPendingSwaps() {
        log.info("GET /api/admin/swaps/pending - Fetching pending swap requests");
        List<AdminSwapResponseDTO> swaps = adminSwapService.getPendingAdminSwaps();
        return ResponseEntity.ok(ApiResponse.success("Pending swap requests fetched successfully", swaps));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AdminSwapResponseDTO>> getSwapById(@PathVariable("id") String id) {
        log.info("GET /api/admin/swaps/{} - Fetching swap request", id);
        AdminSwapResponseDTO swap = adminSwapService.getSwapById(id);
        return ResponseEntity.ok(ApiResponse.success("Swap request fetched successfully", swap));
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<ApiResponse<AdminSwapResponseDTO>> approveSwap(
            @PathVariable("id") String id,
            @Valid @RequestBody SwapActionRequest request,
            Authentication authentication) {
        String adminEmail = authentication.getName();
        log.info("PUT /api/admin/swaps/{}/approve - Admin approving swap", id);
        AdminSwapResponseDTO response = adminSwapService.approveSwap(id, adminEmail, request);
        return ResponseEntity.ok(ApiResponse.success("Swap request approved successfully", response));
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<ApiResponse<AdminSwapResponseDTO>> rejectSwap(
            @PathVariable("id") String id,
            @Valid @RequestBody SwapActionRequest request,
            Authentication authentication) {
        String adminEmail = authentication.getName();
        log.info("PUT /api/admin/swaps/{}/reject - Admin rejecting swap", id);
        AdminSwapResponseDTO response = adminSwapService.rejectSwap(id, adminEmail, request);
        return ResponseEntity.ok(ApiResponse.success("Swap request rejected successfully", response));
    }

    @DeleteMapping("/all")
    public ResponseEntity<ApiResponse<Void>> deleteAllSwaps() {
        log.info("DELETE /api/admin/swaps/all - Deleting all swap requests");
        adminSwapService.deleteAllSwapRequests();
        return ResponseEntity.ok(ApiResponse.success("All swap requests cleared successfully", null));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteSwap(@PathVariable("id") String id) {
        log.info("DELETE /api/admin/swaps/{} - Deleting swap request", id);
        adminSwapService.deleteSwapRequest(id);
        return ResponseEntity.ok(ApiResponse.success("Swap request deleted successfully", null));
    }

    @GetMapping("/pending-count")
    public ResponseEntity<ApiResponse<Long>> getPendingCount() {
        log.info("GET /api/admin/swaps/pending-count - Fetching pending count");
        long count = adminSwapService.getPendingAdminCount();
        return ResponseEntity.ok(ApiResponse.success("Pending count fetched successfully", count));
    }
}