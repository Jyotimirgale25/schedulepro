// src/main/java/com/schedulepro/admin/controller/AdminProfileController.java
package com.schedulepro.admin.controller;

import com.schedulepro.admin.service.AdminProfileService;
import com.schedulepro.common.response.ApiResponse;
import com.schedulepro.employee.dto.request.ChangePasswordRequest;
import com.schedulepro.employee.dto.request.ProfileUpdateRequest;
import com.schedulepro.employee.dto.response.PhotoHistoryDTO;
import com.schedulepro.employee.dto.response.ProfileResponseDTO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/profile")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
@Slf4j
public class AdminProfileController {

    private final AdminProfileService adminProfileService;

    // ===== GET PROFILE =====
    @GetMapping
    public ResponseEntity<ApiResponse<ProfileResponseDTO>> getProfile() {
        log.info("GET /api/admin/profile - Fetching admin profile");
        ProfileResponseDTO profile = adminProfileService.getProfile();
        return ResponseEntity.ok(ApiResponse.success("Profile fetched successfully", profile));
    }

    // ===== UPDATE PROFILE =====
    @PutMapping
    public ResponseEntity<ApiResponse<ProfileResponseDTO>> updateProfile(
            @Valid @RequestBody ProfileUpdateRequest request) {
        log.info("PUT /api/admin/profile - Updating admin profile");
        ProfileResponseDTO updated = adminProfileService.updateProfile(request);
        return ResponseEntity.ok(ApiResponse.success("Profile updated successfully", updated));
    }

    // ===== UPLOAD PHOTO =====
    @PostMapping("/photo")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadPhoto(
            @RequestBody Map<String, String> request) {
        String photoBase64 = request.get("photo");
        log.info("POST /api/admin/profile/photo - Uploading profile photo");

        String photoUrl = adminProfileService.uploadProfilePhoto(photoBase64);

        Map<String, String> response = new HashMap<>();
        response.put("photoUrl", photoUrl);
        response.put("message", "Photo uploaded successfully");

        return ResponseEntity.ok(ApiResponse.success("Photo uploaded successfully", response));
    }

    // ===== CHANGE PASSWORD =====
    @PostMapping("/change-password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @Valid @RequestBody ChangePasswordRequest request) {
        log.info("POST /api/admin/profile/change-password - Changing admin password");
        adminProfileService.changePassword(request);
        return ResponseEntity.ok(ApiResponse.success("Password changed successfully", null));
    }

    // ===== PHOTO HISTORY =====
    @GetMapping("/photo-history")
    public ResponseEntity<ApiResponse<List<PhotoHistoryDTO>>> getPhotoHistory() {
        log.info("GET /api/admin/profile/photo-history - Fetching photo history");
        List<PhotoHistoryDTO> history = adminProfileService.getPhotoHistory();
        return ResponseEntity.ok(ApiResponse.success("Photo history fetched successfully", history));
    }

    @PostMapping("/photo-history")
    public ResponseEntity<ApiResponse<PhotoHistoryDTO>> savePhotoHistory(
            @RequestBody Map<String, String> request) {
        String photo = request.get("photo");
        String type = request.getOrDefault("type", "UPLOADED");
        log.info("POST /api/admin/profile/photo-history - Saving photo history");

        PhotoHistoryDTO saved = adminProfileService.savePhotoHistory(photo, type);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Photo history saved successfully", saved));
    }

    @DeleteMapping("/photo-history/{id}")
    public ResponseEntity<ApiResponse<Void>> deletePhotoHistory(@PathVariable String id) {
        log.info("DELETE /api/admin/profile/photo-history/{} - Deleting photo history", id);
        adminProfileService.deletePhotoHistory(id);
        return ResponseEntity.ok(ApiResponse.success("Photo history deleted successfully", null));
    }

    @DeleteMapping("/photo-history/clear")
    public ResponseEntity<ApiResponse<Void>> clearPhotoHistory() {
        log.info("DELETE /api/admin/profile/photo-history/clear - Clearing photo history");
        adminProfileService.clearPhotoHistory();
        return ResponseEntity.ok(ApiResponse.success("All photo history cleared successfully", null));
    }

    @PostMapping("/photo-history/revert/{id}")
    public ResponseEntity<ApiResponse<Map<String, String>>> revertToPhoto(@PathVariable String id) {
        log.info("POST /api/admin/profile/photo-history/revert/{} - Reverting to photo", id);
        String photoUrl = adminProfileService.revertToPhoto(id);

        Map<String, String> response = new HashMap<>();
        response.put("photoUrl", photoUrl);
        response.put("message", "Photo reverted successfully");

        return ResponseEntity.ok(ApiResponse.success("Photo reverted successfully", response));
    }
}