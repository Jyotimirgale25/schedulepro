// src/main/java/com/schedulepro/admin/service/AdminProfileService.java
package com.schedulepro.admin.service;

import com.schedulepro.employee.dto.request.ChangePasswordRequest;
import com.schedulepro.employee.dto.request.ProfileUpdateRequest;
import com.schedulepro.employee.dto.response.PhotoHistoryDTO;
import com.schedulepro.employee.dto.response.ProfileResponseDTO;
import com.schedulepro.employee.service.ProfileService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminProfileService {

    private final ProfileService profileService;

    public ProfileResponseDTO getProfile() {
        log.info("Admin fetching own profile");
        return profileService.getCurrentUserProfile();
    }

    @Transactional
    public ProfileResponseDTO updateProfile(ProfileUpdateRequest request) {
        log.info("Admin updating own profile");
        return profileService.updateProfile(request);
    }

    @Transactional
    public void changePassword(ChangePasswordRequest request) {
        log.info("Admin changing password");
        profileService.changePassword(request);
    }

    @Transactional
    public String uploadProfilePhoto(String photoData) {
        log.info("Admin uploading profile photo");
        return profileService.uploadProfilePhoto(photoData);
    }

    @Transactional
    public PhotoHistoryDTO savePhotoHistory(String photoData, String type) {
        log.info("Admin saving photo history");
        return profileService.savePhotoHistory(photoData, type);
    }

    public List<PhotoHistoryDTO> getPhotoHistory() {
        log.info("Admin fetching photo history");
        return profileService.getPhotoHistory();
    }

    @Transactional
    public void deletePhotoHistory(String historyId) {
        log.info("Admin deleting photo history");
        profileService.deletePhotoHistory(historyId);
    }

    @Transactional
    public void clearPhotoHistory() {
        log.info("Admin clearing photo history");
        profileService.clearPhotoHistory();
    }

    @Transactional
    public String revertToPhoto(String historyId) {
        log.info("Admin reverting to photo");
        return profileService.revertToPhoto(historyId);
    }
}