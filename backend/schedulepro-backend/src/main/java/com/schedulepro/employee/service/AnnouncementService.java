package com.schedulepro.employee.service;

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
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AnnouncementService {

    private final AnnouncementRepository announcementRepository;
    private final AnnouncementReadRepository announcementReadRepository;
    private final UserRepository userRepository;
    private final NotificationHelper notificationHelper; // ✅ Inject NotificationHelper

    // ============================================
    // CREATE ANNOUNCEMENT WITH NOTIFICATIONS
    // ============================================
    @Transactional
    public AnnouncementResponseDTO createAnnouncement(AnnouncementRequestDTO request, String creatorEmail) {
        log.info("📢 Creating announcement by: {}", creatorEmail);

        User creator = userRepository.findByEmail(creatorEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Creator not found"));

        // Create announcement
        Announcement announcement = Announcement.builder()
                .title(request.getTitle())
                .content(request.getContent())
                .priority(request.getPriority() != null ? request.getPriority() : "NORMAL")
                .isActive(true)
                .createdBy(creator.getId())
                .createdAt(LocalDateTime.now())
                .expiresAt(request.getExpiresAt())
                .build();

        Announcement saved = announcementRepository.save(announcement);
        log.info("✅ Announcement created: {} by {}", saved.getTitle(), creator.getEmail());

        // 🔔 SEND NOTIFICATIONS TO ALL EMPLOYEES
        sendAnnouncementNotifications(saved, creator);

        // Convert to DTO
        return convertToDTO(saved, List.of());
    }

    // ============================================
    // UPDATE ANNOUNCEMENT
    // ============================================
    @Transactional
    public AnnouncementResponseDTO updateAnnouncement(String announcementId,
                                                      AnnouncementRequestDTO request,
                                                      String updaterEmail) {
        log.info("📢 Updating announcement: {} by {}", announcementId, updaterEmail);

        User updater = userRepository.findByEmail(updaterEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Announcement existing = announcementRepository.findById(announcementId)
                .orElseThrow(() -> new ResourceNotFoundException("Announcement not found"));

        // Check if user is authorized (creator or admin)
        if (!existing.getCreatedBy().equals(updater.getId()) &&
                !updater.getRole().equals("ADMIN")) {
            throw new UnauthorizedException("You are not authorized to update this announcement");
        }

        // Update fields
        existing.setTitle(request.getTitle());
        existing.setContent(request.getContent());
        existing.setPriority(request.getPriority() != null ? request.getPriority() : "NORMAL");
        existing.setExpiresAt(request.getExpiresAt());
        existing.setUpdatedAt(LocalDateTime.now());

        Announcement updated = announcementRepository.save(existing);
        log.info("✅ Announcement updated: {}", updated.getTitle());

        // 🔔 OPTIONAL: Send update notification to all employees
        sendAnnouncementUpdateNotifications(updated);

        return convertToDTO(updated, List.of());
    }

    // ============================================
    // DELETE ANNOUNCEMENT
    // ============================================
    @Transactional
    public void deleteAnnouncement(String announcementId, String deleterEmail) {
        log.info("📢 Deleting announcement: {} by {}", announcementId, deleterEmail);

        User deleter = userRepository.findByEmail(deleterEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Announcement announcement = announcementRepository.findById(announcementId)
                .orElseThrow(() -> new ResourceNotFoundException("Announcement not found"));

        // Check authorization
        if (!announcement.getCreatedBy().equals(deleter.getId()) &&
                !deleter.getRole().equals("ADMIN")) {
            throw new UnauthorizedException("You are not authorized to delete this announcement");
        }

        // Soft delete - mark as inactive
        announcement.setIsActive(false);
        announcement.setUpdatedAt(LocalDateTime.now());
        announcementRepository.save(announcement);

        log.info("✅ Announcement deleted (soft): {}", announcementId);

        // 🔔 Notify about deletion
        sendAnnouncementDeletionNotification(announcement);
    }

    // ============================================
    // HARD DELETE ANNOUNCEMENT (Admin only)
    // ============================================
    @Transactional
    public void hardDeleteAnnouncement(String announcementId, String deleterEmail) {
        log.info("📢 Hard deleting announcement: {} by {}", announcementId, deleterEmail);

        User deleter = userRepository.findByEmail(deleterEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!deleter.getRole().equals("ADMIN")) {
            throw new UnauthorizedException("Only admins can permanently delete announcements");
        }

        announcementRepository.deleteById(announcementId);
        log.info("✅ Announcement permanently deleted: {}", announcementId);
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
    // GET ALL ANNOUNCEMENTS (Admin/Manager only)
    // ============================================
    public List<AnnouncementResponseDTO> getAllAnnouncements(String userEmail) {
        log.info("📢 Fetching all announcements for: {}", userEmail);

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!user.getRole().equals("ADMIN") && !user.getRole().equals("MANAGER")) {
            throw new UnauthorizedException("Only admins and managers can view all announcements");
        }

        List<Announcement> announcements = announcementRepository.findAllByOrderByCreatedAtDesc();

        List<String> readIds = announcementReadRepository.findByUserId(user.getId()).stream()
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

        final List<Announcement> finalAnnouncements = activeAnnouncements;
        long unreadCount = finalAnnouncements.stream()
                .filter(a -> !readIds.contains(a.getId()))
                .count();

        log.info("📢 Unread count for user {}: {}", userEmail, unreadCount);
        return unreadCount;
    }

    // ============================================
    // NOTIFICATION HELPER METHODS
    // ============================================

    private void sendAnnouncementNotifications(Announcement announcement, User creator) {
        try {
            // Get all employees (users with EMPLOYEE role)
            List<User> employees = userRepository.findByRole("EMPLOYEE");

            if (employees.isEmpty()) {
                log.warn("⚠️ No employees found to notify about announcement");
                return;
            }

            String title = announcement.getTitle();
            String priority = announcement.getPriority() != null ? announcement.getPriority() : "NORMAL";

            // Send notification to each employee
            for (User employee : employees) {
                notificationHelper.notifyNewAnnouncement(
                        employee.getId(),
                        title
                );
            }

            log.info("✅ Announcement notifications sent to {} employees", employees.size());

            // 📌 Send priority-based notification for HIGH/URGENT
            if ("HIGH".equalsIgnoreCase(priority) || "URGENT".equalsIgnoreCase(priority)) {
                for (User employee : employees) {
                    notificationHelper.createNotification(
                            employee.getId(),
                            creator.getId(),
                            creator.getFullName(),
                            "🔴 URGENT: " + title,
                            announcement.getContent() + " (Priority: " + priority + ")",
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

            for (User employee : employees) {
                notificationHelper.createNotification(
                        employee.getId(),
                        null, // System sender
                        "System",
                        "📝 Announcement Updated",
                        "The announcement '" + announcement.getTitle() + "' has been updated.",
                        "INFO",
                        "ANNOUNCEMENT"
                );
            }
            log.info("✅ Announcement update notifications sent to {} employees", employees.size());
        } catch (Exception e) {
            log.error("❌ Failed to send announcement update notifications: {}", e.getMessage(), e);
        }
    }

    private void sendAnnouncementDeletionNotification(Announcement announcement) {
        try {
            List<User> employees = userRepository.findByRole("EMPLOYEE");

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
    // PRIVATE METHODS
    // ============================================
    private AnnouncementResponseDTO convertToDTO(Announcement announcement, List<String> readIds) {
        final String[] createdByName = {null};
        if (announcement.getCreatedBy() != null) {
            userRepository.findById(announcement.getCreatedBy())
                    .ifPresent(user -> createdByName[0] = user.getFullName());
        }

        boolean isRead = readIds.contains(announcement.getId());

        return AnnouncementResponseDTO.builder()
                .id(announcement.getId())
                .title(announcement.getTitle())
                .content(announcement.getContent())
                .priority(announcement.getPriority())
                .isActive(announcement.getIsActive())
                .createdBy(announcement.getCreatedBy())
                .createdByName(createdByName[0])
                .createdAt(announcement.getCreatedAt())
                .updatedAt(announcement.getUpdatedAt())
                .expiresAt(announcement.getExpiresAt())
                .isRead(isRead)
                .build();
    }
}