// src/main/java/com/schedulepro/admin/service/AdminAnnouncementService.java
package com.schedulepro.admin.service;

import com.schedulepro.admin.dto.request.AnnouncementRequestDTO;
import com.schedulepro.admin.dto.response.AnnouncementResponseDTO;
import com.schedulepro.auth.entity.User;
import com.schedulepro.auth.repository.UserRepository;
import com.schedulepro.common.exception.ResourceNotFoundException;
import com.schedulepro.common.exception.UnauthorizedException;
import com.schedulepro.employee.entity.Announcement;
import com.schedulepro.employee.entity.AnnouncementRead;
import com.schedulepro.employee.repository.AnnouncementReadRepository;
import com.schedulepro.employee.repository.AnnouncementRepository;
import com.schedulepro.employee.service.NotificationHelper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminAnnouncementService {

    private final AnnouncementRepository announcementRepository;
    private final AnnouncementReadRepository announcementReadRepository;
    private final UserRepository userRepository;
    private final NotificationHelper notificationHelper;

    // ============================================
    // CREATE ANNOUNCEMENT (With Notifications)
    // ============================================


    @Transactional
    public AnnouncementResponseDTO createAnnouncement(AnnouncementRequestDTO request, String creatorEmail) {
        log.info("📢 Creating announcement by: {}", creatorEmail);

        User creator = userRepository.findByEmail(creatorEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Creator not found"));

        // ✅ Make sure type is set
        String announcementType = request.getType() != null ? request.getType() : "ANNOUNCEMENT";
        String priority = request.getPriority() != null ? request.getPriority() : "NORMAL";

        Announcement announcement = Announcement.builder()
                .title(request.getTitle())
                .content(request.getContent())
                .type(announcementType)  // ✅ SET TYPE
                .priority(priority)
                .isActive(true)
                .createdBy(creator.getId())
                .createdAt(LocalDateTime.now())
                .expiresAt(request.getExpiresAt())
                .build();

        Announcement saved = announcementRepository.save(announcement);
        log.info("✅ Announcement created: {} by {}", saved.getTitle(), creator.getEmail());

        sendAnnouncementNotifications(saved, creator);

        return convertToDTO(saved, new ArrayList<>());
    }
    // ============================================
    // UPDATE ANNOUNCEMENT (With Authorization - Full version)
    // ============================================
    @Transactional
    public AnnouncementResponseDTO updateAnnouncement(String announcementId,
                                                      AnnouncementRequestDTO request,
                                                      String userEmail) {
        log.info("📢 Updating announcement: {} by {}", announcementId, userEmail);

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Announcement existing = announcementRepository.findById(announcementId)
                .orElseThrow(() -> new ResourceNotFoundException("Announcement not found"));

        // Check authorization
        if (!canManageAnnouncement(existing, user)) {
            throw new UnauthorizedException("You are not authorized to update this announcement");
        }

        existing.setTitle(request.getTitle());
        existing.setContent(request.getContent());
        existing.setPriority(request.getPriority() != null ? request.getPriority() : "NORMAL");
        existing.setExpiresAt(request.getExpiresAt());
        existing.setUpdatedAt(LocalDateTime.now());

        Announcement updated = announcementRepository.save(existing);
        log.info("✅ Announcement updated: {}", updated.getTitle());

        sendAnnouncementUpdateNotifications(updated);
        return convertToDTO(updated, new ArrayList<>());
    }

    // ============================================
    // UPDATE ANNOUNCEMENT (Admin only - no user check)
    // ============================================
    @Transactional
    public AnnouncementResponseDTO updateAnnouncement(String announcementId,
                                                      AnnouncementRequestDTO request) {
        log.info("📢 Admin updating announcement: {}", announcementId);

        Announcement existing = announcementRepository.findById(announcementId)
                .orElseThrow(() -> new ResourceNotFoundException("Announcement not found"));

        existing.setTitle(request.getTitle());
        existing.setContent(request.getContent());
        existing.setPriority(request.getPriority() != null ? request.getPriority() : "NORMAL");
        existing.setExpiresAt(request.getExpiresAt());
        existing.setUpdatedAt(LocalDateTime.now());

        Announcement updated = announcementRepository.save(existing);
        log.info("✅ Announcement updated by admin: {}", updated.getTitle());

        sendAnnouncementUpdateNotifications(updated);
        return convertToDTO(updated, new ArrayList<>());
    }

    // ============================================
    // DELETE ANNOUNCEMENT (With Authorization)
    // ============================================
    @Transactional
    public void deleteAnnouncement(String announcementId, String userEmail) {
        log.info("📢 Deleting announcement: {} by {}", announcementId, userEmail);

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Announcement announcement = announcementRepository.findById(announcementId)
                .orElseThrow(() -> new ResourceNotFoundException("Announcement not found"));

        if (!canManageAnnouncement(announcement, user)) {
            throw new UnauthorizedException("You are not authorized to delete this announcement");
        }

        // Soft delete
        announcement.setIsActive(false);
        announcement.setUpdatedAt(LocalDateTime.now());
        announcementRepository.save(announcement);

        log.info("✅ Announcement deleted: {}", announcementId);
        sendAnnouncementDeletionNotification(announcement);
    }

    // ============================================
    // DELETE ANNOUNCEMENT (Admin only - no user check)
    // ============================================
    @Transactional
    public void deleteAnnouncement(String announcementId) {
        log.info("📢 Admin deleting announcement: {}", announcementId);

        Announcement announcement = announcementRepository.findById(announcementId)
                .orElseThrow(() -> new ResourceNotFoundException("Announcement not found"));

        // Hard delete for admin
        announcementRepository.delete(announcement);
        log.info("✅ Announcement permanently deleted by admin: {}", announcementId);
    }

    // ============================================
    // TOGGLE ANNOUNCEMENT STATUS
    // ============================================
    @Transactional
    public AnnouncementResponseDTO toggleAnnouncementStatus(String announcementId) {
        log.info("📢 Toggling announcement status: {}", announcementId);

        Announcement announcement = announcementRepository.findById(announcementId)
                .orElseThrow(() -> new ResourceNotFoundException("Announcement not found"));

        announcement.setIsActive(!announcement.getIsActive());
        announcement.setUpdatedAt(LocalDateTime.now());
        Announcement updated = announcementRepository.save(announcement);

        log.info("✅ Announcement status toggled to: {}", updated.getIsActive());
        return convertToDTO(updated, new ArrayList<>());
    }

    // ============================================
    // GET ACTIVE ANNOUNCEMENTS FOR USER
    // ============================================
    public List<AnnouncementResponseDTO> getActiveAnnouncements(String userEmail) {
        log.info("📢 Fetching active announcements for user: {}", userEmail);

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        List<Announcement> announcements = announcementRepository.findByIsActiveTrueOrderByCreatedAtDesc();

        List<String> readIds = announcementReadRepository.findByUserId(user.getId()).stream()
                .map(AnnouncementRead::getAnnouncementId)
                .collect(Collectors.toList());

        return announcements.stream()
                .map(announcement -> convertToDTO(announcement, readIds))
                .collect(Collectors.toList());
    }

    // ============================================
    // GET ANNOUNCEMENT BY ID
    // ============================================
    public AnnouncementResponseDTO getAnnouncementById(String announcementId) {
        log.info("📢 Fetching announcement: {}", announcementId);

        Announcement announcement = announcementRepository.findById(announcementId)
                .orElseThrow(() -> new ResourceNotFoundException("Announcement not found"));

        return convertToDTO(announcement, new ArrayList<>());
    }

    // ============================================
    // GET ANNOUNCEMENT BY ID WITH USER (for Manager)
    // ============================================
    public AnnouncementResponseDTO getAnnouncementById(String announcementId, String userEmail) {
        log.info("📢 Fetching announcement: {} for user: {}", announcementId, userEmail);

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Announcement announcement = announcementRepository.findById(announcementId)
                .orElseThrow(() -> new ResourceNotFoundException("Announcement not found"));

        List<String> readIds = announcementReadRepository.findByUserId(user.getId()).stream()
                .map(AnnouncementRead::getAnnouncementId)
                .collect(Collectors.toList());

        return convertToDTO(announcement, readIds);
    }

    // ============================================
    // GET ALL ANNOUNCEMENTS (Admin)
    // ============================================
    public List<AnnouncementResponseDTO> getAllAnnouncements() {
        log.info("📢 Fetching all announcements");

        List<Announcement> announcements = announcementRepository.findAllByOrderByCreatedAtDesc();

        return announcements.stream()
                .map(announcement -> convertToDTO(announcement, new ArrayList<>()))
                .collect(Collectors.toList());
    }

    // ============================================
    // GET ALL ANNOUNCEMENTS (for Manager with read status)
    // ============================================
    public List<AnnouncementResponseDTO> getAllAnnouncements(String userEmail) {
        log.info("📢 Fetching all announcements for: {}", userEmail);

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        List<Announcement> announcements = announcementRepository.findAllByOrderByCreatedAtDesc();

        List<String> readIds = announcementReadRepository.findByUserId(user.getId()).stream()
                .map(AnnouncementRead::getAnnouncementId)
                .collect(Collectors.toList());

        return announcements.stream()
                .map(announcement -> convertToDTO(announcement, readIds))
                .collect(Collectors.toList());
    }

    // ============================================
    // GET TEAM ANNOUNCEMENTS (Manager only)
    // ============================================
    public List<AnnouncementResponseDTO> getTeamAnnouncements(String managerEmail) {
        log.info("📢 Fetching team announcements for manager: {}", managerEmail);

        User manager = userRepository.findByEmail(managerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Manager not found"));

        List<Announcement> announcements = announcementRepository.findByCreatedByOrderByCreatedAtDesc(manager.getId());

        List<String> readIds = announcementReadRepository.findByUserId(manager.getId()).stream()
                .map(AnnouncementRead::getAnnouncementId)
                .collect(Collectors.toList());

        return announcements.stream()
                .map(announcement -> convertToDTO(announcement, readIds))
                .collect(Collectors.toList());
    }

    // ============================================
    // GET MANAGER'S ACTIVE ANNOUNCEMENTS
    // ============================================
    public List<AnnouncementResponseDTO> getManagerActiveAnnouncements(String managerEmail) {
        log.info("📢 Fetching active announcements for manager: {}", managerEmail);

        User manager = userRepository.findByEmail(managerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Manager not found"));

        List<Announcement> announcements = announcementRepository.findByCreatedByAndIsActiveTrueOrderByCreatedAtDesc(manager.getId());

        List<String> readIds = announcementReadRepository.findByUserId(manager.getId()).stream()
                .map(AnnouncementRead::getAnnouncementId)
                .collect(Collectors.toList());

        return announcements.stream()
                .map(announcement -> convertToDTO(announcement, readIds))
                .collect(Collectors.toList());
    }

    // ============================================
    // MARK ANNOUNCEMENT AS READ
    // ============================================
    @Transactional
    public void markAsRead(String announcementId, String userEmail) {
        log.info("📢 Marking announcement {} as read for user {}", announcementId, userEmail);

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!announcementRepository.existsById(announcementId)) {
            throw new ResourceNotFoundException("Announcement not found");
        }

        if (announcementReadRepository.findByAnnouncementIdAndUserId(announcementId, user.getId()).isPresent()) {
            log.info("⚠️ Announcement already marked as read by user: {}", userEmail);
            return;
        }

        AnnouncementRead read = AnnouncementRead.builder()
                .announcementId(announcementId)
                .userId(user.getId())
                .readAt(LocalDateTime.now())
                .build();

        announcementReadRepository.save(read);
        log.info("✅ Announcement {} marked as read by user {}", announcementId, userEmail);
    }

    // ============================================
    // GET UNREAD COUNT
    // ============================================
    public long getUnreadCount(String userEmail) {
        log.info("📢 Getting unread count for user: {}", userEmail);

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        List<Announcement> activeAnnouncements = announcementRepository.findByIsActiveTrueOrderByCreatedAtDesc();

        List<String> readIds = announcementReadRepository.findByUserId(user.getId()).stream()
                .map(AnnouncementRead::getAnnouncementId)
                .collect(Collectors.toList());

        long unreadCount = activeAnnouncements.stream()
                .filter(a -> !readIds.contains(a.getId()))
                .count();

        log.info("📢 Unread count for user {}: {}", userEmail, unreadCount);
        return unreadCount;
    }

    // ============================================
    // AUTHORIZATION HELPER
    // ============================================
    private boolean canManageAnnouncement(Announcement announcement, User user) {
        if ("ADMIN".equals(user.getRole())) {
            return true; // Admin can manage all announcements
        }
        if ("MANAGER".equals(user.getRole())) {
            // Manager can only manage their own announcements
            return announcement.getCreatedBy().equals(user.getId());
        }
        return false; // Employees cannot manage announcements
    }

    // ============================================
    // NOTIFICATION METHODS
    // ============================================
    private void sendAnnouncementNotifications(Announcement announcement, User creator) {
        try {
            List<User> employees = userRepository.findByRole("EMPLOYEE");

            if (employees.isEmpty()) {
                log.warn("⚠️ No employees found to notify about announcement");
                return;
            }

            // Send notification to each employee
            for (User employee : employees) {
                notificationHelper.notifyNewAnnouncement(employee.getId(), announcement.getTitle());
            }

            log.info("✅ Announcement notifications sent to {} employees", employees.size());

            // Send urgent notifications for HIGH/URGENT priority
            if ("HIGH".equalsIgnoreCase(announcement.getPriority()) ||
                    "URGENT".equalsIgnoreCase(announcement.getPriority())) {
                for (User employee : employees) {
                    notificationHelper.createNotification(
                            employee.getId(),
                            creator.getId(),
                            creator.getFullName(),
                            "🔴 URGENT: " + announcement.getTitle(),
                            announcement.getContent() + " (Priority: " + announcement.getPriority() + ")",
                            "URGENT",
                            "ANNOUNCEMENT"
                    );
                }
                log.info("🔴 Urgent announcement notification sent to all employees");
            }

        } catch (Exception e) {
            log.error("❌ Failed to send announcement notifications: {}", e.getMessage(), e);
        }
    }

    private void sendAnnouncementUpdateNotifications(Announcement announcement) {
        try {
            List<User> employees = userRepository.findByRole("EMPLOYEE");

            if (employees.isEmpty()) {
                return;
            }

            for (User employee : employees) {
                notificationHelper.createNotification(
                        employee.getId(),
                        null,
                        "System",
                        "📝 Announcement Updated",
                        "The announcement '" + announcement.getTitle() + "' has been updated.",
                        "INFO",
                        "ANNOUNCEMENT"
                );
            }
            log.info("✅ Announcement update notifications sent to {} employees", employees.size());
        } catch (Exception e) {
            log.error("❌ Failed to send update notifications: {}", e.getMessage(), e);
        }
    }

    private void sendAnnouncementDeletionNotification(Announcement announcement) {
        try {
            List<User> employees = userRepository.findByRole("EMPLOYEE");

            if (employees.isEmpty()) {
                return;
            }

            for (User employee : employees) {
                notificationHelper.createNotification(
                        employee.getId(),
                        null,
                        "System",
                        "❌ Announcement Removed",
                        "The announcement '" + announcement.getTitle() + "' has been removed.",
                        "INFO",
                        "ANNOUNCEMENT"
                );
            }
            log.info("✅ Announcement deletion notifications sent to {} employees", employees.size());
        } catch (Exception e) {
            log.error("❌ Failed to send deletion notifications: {}", e.getMessage(), e);
        }
    }

    // ============================================
    // CONVERT TO DTO
    // ============================================
    // In AdminAnnouncementService.java - Update convertToDTO

    private AnnouncementResponseDTO convertToDTO(Announcement announcement, List<String> readIds) {
        String createdByName = null;

        if (announcement.getCreatedBy() != null) {
            createdByName = userRepository.findById(announcement.getCreatedBy())
                    .map(User::getFullName)
                    .orElse(null);
        }

        boolean isRead = readIds != null && readIds.contains(announcement.getId());

        return AnnouncementResponseDTO.builder()
                .id(announcement.getId())
                .title(announcement.getTitle())
                .content(announcement.getContent())
                .type(announcement.getType())  // ✅ ADD THIS
                .priority(announcement.getPriority())
                .isActive(announcement.getIsActive())
                .createdBy(announcement.getCreatedBy())
                .createdByName(createdByName)
                .createdAt(announcement.getCreatedAt())
                .updatedAt(announcement.getUpdatedAt())
                .expiresAt(announcement.getExpiresAt())
                .isRead(isRead)
                .build();
    }
}