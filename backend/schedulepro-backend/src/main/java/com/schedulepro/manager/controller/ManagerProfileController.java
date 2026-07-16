// src/main/java/com/schedulepro/manager/controller/ManagerProfileController.java
package com.schedulepro.manager.controller;

import com.schedulepro.common.response.ApiResponse;
import com.schedulepro.manager.dto.request.ManagerProfileRequestDTO;
import com.schedulepro.manager.dto.response.ManagerProfileResponseDTO;
import com.schedulepro.manager.dto.response.ManagerStatsDTO;
import com.schedulepro.manager.service.ManagerProfileService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.Map;

@RestController
@RequestMapping("/api/manager/profile")
@PreAuthorize("hasRole('MANAGER')")
@RequiredArgsConstructor
@Slf4j
public class ManagerProfileController {

    private final ManagerProfileService managerProfileService;

    /**
     * GET /api/manager/profile
     * Get manager profile
     */
    @GetMapping
    public ResponseEntity<ApiResponse<ManagerProfileResponseDTO>> getProfile(Authentication authentication) {
        String email = authentication.getName();
        log.info("GET /api/manager/profile - Fetching manager profile for: {}", email);

        ManagerProfileResponseDTO profile = managerProfileService.getManagerProfile(email);
        return ResponseEntity.ok(ApiResponse.success("Profile fetched successfully", profile));
    }

    /**
     * PUT /api/manager/profile
     * Update manager profile
     */
    @PutMapping
    public ResponseEntity<ApiResponse<ManagerProfileResponseDTO>> updateProfile(
            @Valid @RequestBody ManagerProfileRequestDTO request,
            Authentication authentication) {
        String email = authentication.getName();
        log.info("PUT /api/manager/profile - Updating manager profile for: {}", email);

        ManagerProfileResponseDTO updated = managerProfileService.updateManagerProfile(email, request);
        return ResponseEntity.ok(ApiResponse.success("Profile updated successfully", updated));
    }

    /**
     * POST /api/manager/profile/photo
     * Upload profile photo
     */
    @PostMapping("/photo")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadPhoto(
            @RequestBody Map<String, String> request,
            Authentication authentication) {
        String email = authentication.getName();
        String photoBase64 = request.get("photo");
        log.info("POST /api/manager/profile/photo - Uploading photo for: {}", email);

        String photoUrl = managerProfileService.uploadProfilePhoto(email, photoBase64);

        Map<String, String> response = Map.of(
                "photoUrl", photoUrl,
                "message", "Photo uploaded successfully"
        );

        return ResponseEntity.ok(ApiResponse.success("Photo uploaded successfully", response));
    }

    /**
     * GET /api/manager/profile/stats
     * Get manager dashboard stats
     */
    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<ManagerStatsDTO>> getManagerStats(Authentication authentication) {
        String email = authentication.getName();
        log.info("GET /api/manager/profile/stats - Fetching manager stats for: {}", email);

        ManagerStatsDTO stats = managerProfileService.getManagerStats(email);
        return ResponseEntity.ok(ApiResponse.success("Stats fetched successfully", stats));
    }
}