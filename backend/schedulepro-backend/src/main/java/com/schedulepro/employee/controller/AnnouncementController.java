// src/main/java/com/schedulepro/employee/controller/AnnouncementController.java
package com.schedulepro.employee.controller;

import com.schedulepro.admin.dto.response.AnnouncementResponseDTO;
import com.schedulepro.admin.service.AdminAnnouncementService;
import com.schedulepro.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/announcements")
@PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER', 'ADMIN')")
@RequiredArgsConstructor
@Slf4j
public class AnnouncementController {

    private final AdminAnnouncementService announcementService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<AnnouncementResponseDTO>>> getActiveAnnouncements(
            Authentication authentication) {
        String userEmail = authentication.getName();
        log.info("GET /api/announcements - Fetching active announcements for user: {}", userEmail);
        List<AnnouncementResponseDTO> announcements = announcementService.getActiveAnnouncements(userEmail);
        return ResponseEntity.ok(ApiResponse.success("Announcements fetched successfully", announcements));
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(
            @PathVariable String id,
            Authentication authentication) {
        String userEmail = authentication.getName();
        log.info("POST /api/announcements/{}/read - Marking announcement as read", id);
        announcementService.markAsRead(id, userEmail);
        return ResponseEntity.ok(ApiResponse.success("Announcement marked as read", null));
    }

    @GetMapping("/unread/count")
    public ResponseEntity<ApiResponse<Long>> getUnreadCount(Authentication authentication) {
        String userEmail = authentication.getName();
        log.info("GET /api/announcements/unread/count - Getting unread count for user: {}", userEmail);
        long count = announcementService.getUnreadCount(userEmail);
        return ResponseEntity.ok(ApiResponse.success("Unread count fetched successfully", count));
    }
}