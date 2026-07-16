// src/main/java/com/schedulepro/admin/controller/AdminAnnouncementController.java
package com.schedulepro.admin.controller;

import com.schedulepro.admin.dto.request.AnnouncementRequestDTO;
import com.schedulepro.admin.dto.response.AnnouncementResponseDTO;
import com.schedulepro.admin.service.AdminAnnouncementService;
import com.schedulepro.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/announcements")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Slf4j
public class AdminAnnouncementController {

    private final AdminAnnouncementService announcementService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<AnnouncementResponseDTO>>> getAllAnnouncements() {
        log.info("📢 GET /api/admin/announcements - Fetching all announcements");
        List<AnnouncementResponseDTO> announcements = announcementService.getAllAnnouncements();
        return ResponseEntity.ok(ApiResponse.success("All announcements fetched", announcements));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AnnouncementResponseDTO>> getAnnouncementById(@PathVariable String id) {
        log.info("📢 GET /api/admin/announcements/{} - Fetching announcement", id);
        AnnouncementResponseDTO announcement = announcementService.getAnnouncementById(id);
        return ResponseEntity.ok(ApiResponse.success("Announcement fetched", announcement));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<AnnouncementResponseDTO>> createAnnouncement(
            @Valid @RequestBody AnnouncementRequestDTO request,
            Authentication authentication) {
        String adminEmail = authentication.getName();
        log.info("📢 POST /api/admin/announcements - Admin {} creating announcement", adminEmail);
        AnnouncementResponseDTO created = announcementService.createAnnouncement(request, adminEmail);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Announcement created successfully", created));
    }

    // ✅ Uses the 2-parameter version (no userEmail needed for admin)
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<AnnouncementResponseDTO>> updateAnnouncement(
            @PathVariable String id,
            @Valid @RequestBody AnnouncementRequestDTO request) {
        log.info("📢 PUT /api/admin/announcements/{} - Admin updating announcement", id);
        AnnouncementResponseDTO updated = announcementService.updateAnnouncement(id, request);
        return ResponseEntity.ok(ApiResponse.success("Announcement updated successfully", updated));
    }

    @PutMapping("/{id}/toggle")
    public ResponseEntity<ApiResponse<AnnouncementResponseDTO>> toggleAnnouncementStatus(@PathVariable String id) {
        log.info("📢 PUT /api/admin/announcements/{}/toggle - Admin toggling announcement status", id);
        AnnouncementResponseDTO updated = announcementService.toggleAnnouncementStatus(id);
        return ResponseEntity.ok(ApiResponse.success("Announcement status toggled", updated));
    }

    // ✅ Uses the 1-parameter version (no userEmail needed for admin)
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteAnnouncement(@PathVariable String id) {
        log.info("📢 DELETE /api/admin/announcements/{} - Admin deleting announcement", id);
        announcementService.deleteAnnouncement(id);
        return ResponseEntity.ok(ApiResponse.success("Announcement deleted successfully", null));
    }
}