// src/main/java/com/schedulepro/manager/controller/ManagerAnnouncementController.java
package com.schedulepro.manager.controller;

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
@RequestMapping("/api/manager/announcements")
@RequiredArgsConstructor
@PreAuthorize("hasRole('MANAGER')")  // ✅ Only managers can access
@Slf4j
public class ManagerAnnouncementController {

    private final AdminAnnouncementService announcementService;

    // ============================================
    // CREATE ANNOUNCEMENT (Manager)
    // ============================================
    @PostMapping
    public ResponseEntity<ApiResponse<AnnouncementResponseDTO>> createAnnouncement(
            @Valid @RequestBody AnnouncementRequestDTO request,
            Authentication authentication) {
        String managerEmail = authentication.getName();
        log.info("📢 POST /api/manager/announcements - Manager {} creating announcement", managerEmail);

        AnnouncementResponseDTO created = announcementService.createAnnouncement(request, managerEmail);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Announcement created and notifications sent to your team", created));
    }

    // ============================================
    // UPDATE ANNOUNCEMENT (Manager - Only their own)
    // ============================================
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<AnnouncementResponseDTO>> updateAnnouncement(
            @PathVariable String id,
            @Valid @RequestBody AnnouncementRequestDTO request,
            Authentication authentication) {
        String managerEmail = authentication.getName();
        log.info("📢 PUT /api/manager/announcements/{} - Manager {} updating announcement", id, managerEmail);

        AnnouncementResponseDTO updated = announcementService.updateAnnouncement(id, request, managerEmail);
        return ResponseEntity.ok(ApiResponse.success("Announcement updated successfully", updated));
    }

    // ============================================
    // DELETE ANNOUNCEMENT (Manager - Only their own)
    // ============================================
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteAnnouncement(
            @PathVariable String id,
            Authentication authentication) {
        String managerEmail = authentication.getName();
        log.info("📢 DELETE /api/manager/announcements/{} - Manager {} deleting announcement", id, managerEmail);

        announcementService.deleteAnnouncement(id, managerEmail);
        return ResponseEntity.ok(ApiResponse.success("Announcement deleted successfully", null));
    }

    // ============================================
    // GET ANNOUNCEMENT BY ID (Manager)
    // ============================================
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AnnouncementResponseDTO>> getAnnouncementById(
            @PathVariable String id,
            Authentication authentication) {
        String managerEmail = authentication.getName();
        log.info("📢 GET /api/manager/announcements/{} - Manager {} fetching announcement", id, managerEmail);

        AnnouncementResponseDTO announcement = announcementService.getAnnouncementById(id, managerEmail);
        return ResponseEntity.ok(ApiResponse.success("Announcement fetched", announcement));
    }

    // ============================================
    // GET ALL ANNOUNCEMENTS (Manager - Only their team's)
    // ============================================
    @GetMapping("/team")
    public ResponseEntity<ApiResponse<List<AnnouncementResponseDTO>>> getTeamAnnouncements(
            Authentication authentication) {
        String managerEmail = authentication.getName();
        log.info("📢 GET /api/manager/announcements/team - Manager {} fetching team announcements", managerEmail);

        List<AnnouncementResponseDTO> announcements = announcementService.getTeamAnnouncements(managerEmail);
        return ResponseEntity.ok(ApiResponse.success("Team announcements fetched", announcements));
    }

    // ============================================
    // GET ALL ANNOUNCEMENTS (Manager - All, but read-only)
    // ============================================
    @GetMapping("/all")
    public ResponseEntity<ApiResponse<List<AnnouncementResponseDTO>>> getAllAnnouncements(
            Authentication authentication) {
        String managerEmail = authentication.getName();
        log.info("📢 GET /api/manager/announcements/all - Manager {} fetching all announcements", managerEmail);

        List<AnnouncementResponseDTO> announcements = announcementService.getAllAnnouncements(managerEmail);
        return ResponseEntity.ok(ApiResponse.success("All announcements fetched", announcements));
    }
}