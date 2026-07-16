// src/main/java/com/schedulepro/employee/service/ProfileService.java
package com.schedulepro.employee.service;

import com.schedulepro.auth.entity.User;
import com.schedulepro.auth.repository.UserRepository;
import com.schedulepro.common.exception.ResourceNotFoundException;
import com.schedulepro.common.exception.UnauthorizedException;
import com.schedulepro.employee.dto.request.ChangePasswordRequest;
import com.schedulepro.employee.dto.request.ProfileUpdateRequest;
import com.schedulepro.employee.dto.response.PhotoHistoryDTO;
import com.schedulepro.employee.dto.response.ProfileResponseDTO;
import com.schedulepro.employee.entity.PhotoHistory;
import com.schedulepro.employee.repository.PhotoHistoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProfileService {

    private final UserRepository userRepository;
    private final PhotoHistoryRepository photoHistoryRepository;
    private final PasswordEncoder passwordEncoder;

    public ProfileResponseDTO getCurrentUserProfile() {
        User currentUser = getCurrentUser();
        return mapToProfileResponseDTO(currentUser);
    }
    @Transactional
    public ProfileResponseDTO updateProfile(ProfileUpdateRequest request) {
        User currentUser = getCurrentUser();

        log.info("📥 Updating profile for user: {}", currentUser.getEmail());

        // Update basic info
        if (request.getFullName() != null) {
            currentUser.setFullName(request.getFullName());
        }

        if (request.getEmail() != null) {
            currentUser.setEmail(request.getEmail());
            currentUser.setUsername(request.getEmail());
        }

        if (request.getPhone() != null) {
            currentUser.setPhone(request.getPhone());
        }

        if (request.getAlternatePhone() != null) {
            currentUser.setAlternatePhone(request.getAlternatePhone());
        }

        if (request.getDepartment() != null) {
            currentUser.setDepartment(request.getDepartment());
        }

        if (request.getPosition() != null) {
            currentUser.setPosition(request.getPosition());
        }

        if (request.getDateOfBirth() != null) {
            currentUser.setDateOfBirth(request.getDateOfBirth());
        }

        if (request.getBloodGroup() != null) {
            currentUser.setBloodGroup(request.getBloodGroup());
        }

        if (request.getAddress() != null) {
            currentUser.setAddress(request.getAddress());
        }

        // ✅ FIX: Handle profile photo - KEEP existing photo if not sending new one
        // Note: Photo upload is handled separately via uploadProfilePhoto()
        // Do NOT overwrite photo here unless you want to clear it

        // Update emergency contact
        if (request.getEmergencyContact() != null) {
            if (request.getEmergencyContact().getName() != null) {
                currentUser.setEmergencyContactName(request.getEmergencyContact().getName());
            }
            if (request.getEmergencyContact().getRelationship() != null) {
                currentUser.setEmergencyContactRelationship(request.getEmergencyContact().getRelationship());
            }
            if (request.getEmergencyContact().getPhone() != null) {
                currentUser.setEmergencyContactPhone(request.getEmergencyContact().getPhone());
            }
        }

        // Update skills
        if (request.getSkills() != null && !request.getSkills().isEmpty()) {
            currentUser.setSkills(String.join(",", request.getSkills()));
        } else if (request.getSkills() != null) {
            currentUser.setSkills(null);
        }

        // Update languages
        if (request.getLanguages() != null && !request.getLanguages().isEmpty()) {
            currentUser.setLanguages(String.join(",", request.getLanguages()));
        } else if (request.getLanguages() != null) {
            currentUser.setLanguages(null);
        }

        // Update social links
        if (request.getSocialLinks() != null) {
            if (request.getSocialLinks().getLinkedin() != null) {
                currentUser.setLinkedinUrl(request.getSocialLinks().getLinkedin());
            }
            if (request.getSocialLinks().getGithub() != null) {
                currentUser.setGithubUrl(request.getSocialLinks().getGithub());
            }
            if (request.getSocialLinks().getTwitter() != null) {
                currentUser.setTwitterUrl(request.getSocialLinks().getTwitter());
            }
        }

        User updatedUser = userRepository.save(currentUser);
        log.info("✅ Profile updated successfully for user: {}", updatedUser.getEmail());

        return mapToProfileResponseDTO(updatedUser);
    }

    @Transactional
    public void changePassword(ChangePasswordRequest request) {
        User currentUser = getCurrentUser();

        // Verify current password
        if (!passwordEncoder.matches(request.getCurrentPassword(), currentUser.getPassword())) {
            throw new UnauthorizedException("Current password is incorrect");
        }

        // Check if new password matches confirmation
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new IllegalArgumentException("New password and confirmation do not match");
        }

        // Update password
        currentUser.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(currentUser);
        log.info("Password changed for user: {}", currentUser.getEmail());
    }

    @Transactional
    public String uploadProfilePhoto(String photoData) {
        User currentUser = getCurrentUser();

        log.info("📸 Uploading photo for user: {}, photo length: {}",
                currentUser.getEmail(),
                photoData != null ? photoData.length() : 0);

        if (photoData == null || photoData.isEmpty()) {
            throw new IllegalArgumentException("Photo data is required");
        }

        // Save current photo to history before updating
        if (currentUser.getProfilePhoto() != null) {
            PhotoHistory history = PhotoHistory.builder()
                    .user(currentUser)
                    .photo(currentUser.getProfilePhoto())
                    .type("PREVIOUS")
                    .timestamp(LocalDateTime.now())
                    .build();
            photoHistoryRepository.save(history);
        }

        // Update user's profile photo
        currentUser.setProfilePhoto(photoData);
        userRepository.save(currentUser);

        log.info("✅ Profile photo uploaded for user: {}", currentUser.getEmail());
        return photoData;
    }

    @Transactional
    public PhotoHistoryDTO savePhotoHistory(String photoData, String type) {
        User currentUser = getCurrentUser();

        PhotoHistory history = PhotoHistory.builder()
                .user(currentUser)
                .photo(photoData)
                .type(type)
                .timestamp(LocalDateTime.now())
                .build();

        PhotoHistory saved = photoHistoryRepository.save(history);
        log.info("Photo history saved for user: {}, type: {}", currentUser.getEmail(), type);

        return mapToPhotoHistoryDTO(saved);
    }

    public List<PhotoHistoryDTO> getPhotoHistory() {
        User currentUser = getCurrentUser();
        return photoHistoryRepository.findByUserIdOrderByTimestampDesc(currentUser.getId())
                .stream()
                .map(this::mapToPhotoHistoryDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deletePhotoHistory(String historyId) {
        User currentUser = getCurrentUser();
        PhotoHistory history = photoHistoryRepository.findById(historyId)
                .orElseThrow(() -> new ResourceNotFoundException("Photo history not found"));

        if (!history.getUser().getId().equals(currentUser.getId())) {
            throw new UnauthorizedException("You don't have permission to delete this photo");
        }

        photoHistoryRepository.delete(history);
        log.info("Photo history deleted: {}", historyId);
    }

    @Transactional
    public void clearPhotoHistory() {
        User currentUser = getCurrentUser();
        photoHistoryRepository.deleteByUserId(currentUser.getId());
        log.info("All photo history cleared for user: {}", currentUser.getEmail());
    }

    @Transactional
    public String revertToPhoto(String historyId) {
        User currentUser = getCurrentUser();
        PhotoHistory history = photoHistoryRepository.findById(historyId)
                .orElseThrow(() -> new ResourceNotFoundException("Photo history not found"));

        if (!history.getUser().getId().equals(currentUser.getId())) {
            throw new UnauthorizedException("You don't have permission to revert to this photo");
        }

        // Save current photo to history
        if (currentUser.getProfilePhoto() != null) {
            PhotoHistory newHistory = PhotoHistory.builder()
                    .user(currentUser)
                    .photo(currentUser.getProfilePhoto())
                    .type("PREVIOUS")
                    .timestamp(LocalDateTime.now())
                    .build();
            photoHistoryRepository.save(newHistory);
        }

        // Revert to selected photo
        currentUser.setProfilePhoto(history.getPhoto());
        userRepository.save(currentUser);

        log.info("Photo reverted for user: {}", currentUser.getEmail());
        return history.getPhoto();
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private ProfileResponseDTO mapToProfileResponseDTO(User user) {
        ProfileResponseDTO.ProfileResponseDTOBuilder builder = ProfileResponseDTO.builder()
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .alternatePhone(user.getAlternatePhone())
                .profilePhoto(user.getProfilePhoto())
                .department(user.getDepartment())
                .position(user.getPosition())
                .employeeId(user.getEmployeeId())
                .joinDate(user.getJoinDate())
                .bloodGroup(user.getBloodGroup())
                .dateOfBirth(user.getDateOfBirth())
                .address(user.getAddress());

        // Emergency Contact
        if (user.getEmergencyContactName() != null ||
                user.getEmergencyContactRelationship() != null ||
                user.getEmergencyContactPhone() != null) {

            ProfileResponseDTO.EmergencyContactDTO emergency = ProfileResponseDTO.EmergencyContactDTO.builder()
                    .name(user.getEmergencyContactName())
                    .relationship(user.getEmergencyContactRelationship())
                    .phone(user.getEmergencyContactPhone())
                    .build();
            builder.emergencyContact(emergency);
        }

        // Skills
        if (user.getSkills() != null && !user.getSkills().isEmpty()) {
            builder.skills(List.of(user.getSkills().split(",")));
        }

        // Languages
        if (user.getLanguages() != null && !user.getLanguages().isEmpty()) {
            builder.languages(List.of(user.getLanguages().split(",")));
        }

        // Social Links
        ProfileResponseDTO.SocialLinksDTO social = ProfileResponseDTO.SocialLinksDTO.builder()
                .linkedin(user.getLinkedinUrl())
                .github(user.getGithubUrl())
                .twitter(user.getTwitterUrl())
                .build();
        builder.socialLinks(social);

        return builder.build();
    }

    private PhotoHistoryDTO mapToPhotoHistoryDTO(PhotoHistory history) {
        return PhotoHistoryDTO.builder()
                .id(history.getId())
                .photo(history.getPhoto())
                .type(history.getType())
                .timestamp(history.getTimestamp())
                .build();
    }
}