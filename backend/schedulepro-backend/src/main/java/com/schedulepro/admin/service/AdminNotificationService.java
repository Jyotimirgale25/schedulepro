// src/main/java/com/schedulepro/admin/service/AdminNotificationService.java
package com.schedulepro.admin.service;

import com.schedulepro.admin.dto.request.BroadcastNotificationRequest;
import com.schedulepro.admin.dto.response.AdminNotificationDTO;
import com.schedulepro.admin.dto.response.NotificationStatsDTO;
import com.schedulepro.auth.entity.User;
import com.schedulepro.auth.repository.UserRepository;
import com.schedulepro.common.exception.ResourceNotFoundException;
import com.schedulepro.employee.dto.response.NotificationDTO;
import com.schedulepro.employee.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;
import com.schedulepro.employee.entity.Notification;
import com.schedulepro.employee.entity.NotificationType;
import com.schedulepro.employee.repository.NotificationRepository;


import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;


@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class AdminNotificationService {

    private final NotificationService notificationService;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;

    // ===== GET ALL NOTIFICATIONS =====
    public List<AdminNotificationDTO> getAllNotifications() {
        log.info("Admin fetching all notifications");

        List<User> allUsers = userRepository.findAll();
        List<AdminNotificationDTO> allNotifications = new ArrayList<>();

        for (User user : allUsers) {
            try {
                List<NotificationDTO> userNotifications = notificationService.getUserNotifications(user.getEmail());
                for (NotificationDTO notif : userNotifications) {
                    allNotifications.add(convertToAdminDTO(notif, user));
                }
            } catch (Exception e) {
                log.warn("Failed to get notifications for user: {}", user.getEmail());
            }
        }

        allNotifications.sort((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()));
        return allNotifications;
    }

    // ===== GET PAGINATED NOTIFICATIONS =====
    public Page<AdminNotificationDTO> getAllNotificationsPaginated(Pageable pageable) {
        log.info("Admin fetching paginated notifications");
        List<AdminNotificationDTO> allNotifications = getAllNotifications();
        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), allNotifications.size());

        if (start > allNotifications.size()) {
            return Page.empty(pageable);
        }

        List<AdminNotificationDTO> pageContent = allNotifications.subList(start, end);
        return new PageImpl<>(pageContent, pageable, allNotifications.size());
    }

    // ===== GET USER NOTIFICATIONS =====
    public List<AdminNotificationDTO> getUserNotifications(String userId) {
        log.info("Admin fetching notifications for user: {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        List<NotificationDTO> userNotifications = notificationService.getUserNotifications(user.getEmail());

        return userNotifications.stream()
                .map(notif -> convertToAdminDTO(notif, user))
                .collect(Collectors.toList());
    }

    // ===== GET NOTIFICATIONS BY TYPE =====
    public List<AdminNotificationDTO> getNotificationsByType(String type) {
        log.info("Admin fetching notifications by type: {}", type);

        List<User> allUsers = userRepository.findAll();
        List<AdminNotificationDTO> filteredNotifications = new ArrayList<>();

        for (User user : allUsers) {
            try {
                List<NotificationDTO> userNotifications = notificationService.getUserNotifications(user.getEmail());
                for (NotificationDTO notif : userNotifications) {
                    if (notif.getType() != null && notif.getType().equalsIgnoreCase(type)) {
                        filteredNotifications.add(convertToAdminDTO(notif, user));
                    }
                }
            } catch (Exception e) {
                log.warn("Failed to get notifications for user: {}", user.getEmail());
            }
        }

        filteredNotifications.sort((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()));
        return filteredNotifications;
    }

    // ===== GET NOTIFICATION BY ID =====
    public AdminNotificationDTO getNotificationById(String notificationId) {
        log.info("Admin fetching notification by ID: {}", notificationId);

        List<User> allUsers = userRepository.findAll();

        for (User user : allUsers) {
            try {
                List<NotificationDTO> userNotifications = notificationService.getUserNotifications(user.getEmail());
                for (NotificationDTO notif : userNotifications) {
                    if (notif.getId().equals(notificationId)) {
                        return convertToAdminDTO(notif, user);
                    }
                }
            } catch (Exception e) {
                log.warn("Failed to get notifications for user: {}", user.getEmail());
            }
        }

        throw new ResourceNotFoundException("Notification not found with id: " + notificationId);
    }

    // ===== BROADCAST NOTIFICATION =====
    @Transactional
    public void broadcastNotification(BroadcastNotificationRequest request, String adminEmail) {
        log.info("Admin {} broadcasting notification: {}", adminEmail, request.getTitle());

        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Admin not found with email: " + adminEmail));

        List<User> targetUsers = getTargetUsers(request.getTargetRole());

        int successCount = 0;
        for (User user : targetUsers) {
            try {
                notificationService.createNotification(
                        user.getEmail(),
                        request.getTitle(),
                        request.getMessage(),
                        request.getType() != null ? request.getType() : "SYSTEM"
                );
                successCount++;
            } catch (Exception e) {
                log.warn("Failed to send notification to user: {}", user.getEmail());
            }
        }

        log.info("Broadcast notification sent to {} out of {} users", successCount, targetUsers.size());
    }

    // ===== DELETE NOTIFICATION =====
    @Transactional
    public void deleteNotification(String notificationId) {
        log.info("Admin deleting notification: {}", notificationId);

        List<User> allUsers = userRepository.findAll();

        for (User user : allUsers) {
            try {
                List<NotificationDTO> userNotifications = notificationService.getUserNotifications(user.getEmail());
                for (NotificationDTO notif : userNotifications) {
                    if (notif.getId().equals(notificationId)) {
                        notificationService.deleteNotification(notificationId, user.getEmail());
                        log.info("Notification deleted: {}", notificationId);
                        return;
                    }
                }
            } catch (Exception e) {
                log.warn("Failed to delete notification for user: {}", user.getEmail());
            }
        }

        throw new ResourceNotFoundException("Notification not found with id: " + notificationId);
    }

    // ===== DELETE USER NOTIFICATIONS =====
    @Transactional
    public void deleteUserNotifications(String userId) {
        log.info("Admin deleting all notifications for user: {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        notificationService.deleteAllNotifications(user.getEmail());
        log.info("All notifications deleted for user: {}", userId);
    }

    // ===== DELETE ALL NOTIFICATIONS =====
    @Transactional
    public void deleteAllNotifications() {
        log.info("Admin deleting all notifications for all users");

        List<User> allUsers = userRepository.findAll();
        int deletedCount = 0;

        for (User user : allUsers) {
            try {
                notificationService.deleteAllNotifications(user.getEmail());
                deletedCount++;
            } catch (Exception e) {
                log.warn("Failed to delete notifications for user: {}", user.getEmail());
            }
        }

        log.info("Deleted notifications for {} users", deletedCount);
    }

    // ===== GET NOTIFICATION STATS =====
    public NotificationStatsDTO getNotificationStats() {
        log.info("Admin fetching notification statistics");

        long total = getTotalNotificationCount();
        long unread = getUnreadNotificationCount();

        return NotificationStatsDTO.builder()
                .totalNotifications(total)
                .unreadNotifications(unread)
                .readNotifications(total - unread)
                .build();
    }

    // ===== GET TOTAL NOTIFICATION COUNT =====
    public long getTotalNotificationCount() {
        log.info("Admin fetching total notification count");

        List<User> allUsers = userRepository.findAll();
        long total = 0;

        for (User user : allUsers) {
            try {
                List<NotificationDTO> userNotifications = notificationService.getUserNotifications(user.getEmail());
                total += userNotifications.size();
            } catch (Exception e) {
                log.warn("Failed to get notifications for user: {}", user.getEmail());
            }
        }

        return total;
    }

    // ===== GET UNREAD NOTIFICATION COUNT =====
    public long getUnreadNotificationCount() {
        log.info("Admin fetching unread notification count");

        List<User> allUsers = userRepository.findAll();
        long unread = 0;

        for (User user : allUsers) {
            try {
                List<NotificationDTO> userNotifications = notificationService.getUserNotifications(user.getEmail());
                unread += userNotifications.stream()
                        .filter(n -> !n.getIsRead())
                        .count();
            } catch (Exception e) {
                log.warn("Failed to get notifications for user: {}", user.getEmail());
            }
        }

        return unread;
    }

    // ===== GET READ NOTIFICATION COUNT =====
    public long getReadNotificationCount() {
        log.info("Admin fetching read notification count");

        List<User> allUsers = userRepository.findAll();
        long read = 0;

        for (User user : allUsers) {
            try {
                List<NotificationDTO> userNotifications = notificationService.getUserNotifications(user.getEmail());
                read += userNotifications.stream()
                        .filter(n -> n.getIsRead())
                        .count();
            } catch (Exception e) {
                log.warn("Failed to get notifications for user: {}", user.getEmail());
            }
        }

        return read;
    }

    // ===== GET UNREAD COUNT (for badge) =====
    public long getUnreadCount() {
        return getUnreadNotificationCount();
    }



    // ===== MARK ALL NOTIFICATIONS AS READ FOR USER =====
    @Transactional
    public void markAllNotificationsAsRead(String userId) {
        log.info("Admin marking all notifications as read for user: {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        notificationService.markAllAsRead(user.getEmail());
        log.info("All notifications marked as read for user: {}", userId);
    }

    // ===== GET TARGET USERS =====
    private List<User> getTargetUsers(String targetRole) {
        if (targetRole == null || "ALL".equalsIgnoreCase(targetRole)) {
            return userRepository.findAll();
        }

        try {
            return userRepository.findAll().stream()
                    .filter(u -> u.getRole() != null && u.getRole().equalsIgnoreCase(targetRole))
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.warn("Invalid target role: {}, sending to all users", targetRole);
            return userRepository.findAll();
        }
    }

    // ===== CONVERT TO ADMIN DTO =====
    private AdminNotificationDTO convertToAdminDTO(NotificationDTO notification, User user) {
        return AdminNotificationDTO.builder()
                .id(notification.getId())
                .userId(user.getId())
                .userFullName(user.getFullName())
                .userEmail(user.getEmail())
                .senderName(notification.getSenderName() != null ? notification.getSenderName() : "System")
                .title(notification.getTitle())
                .message(notification.getMessage())
                .type(notification.getType() != null ? notification.getType() : "GENERAL")
                .isRead(notification.getIsRead() != null ? notification.getIsRead() : false)
                .readAt(notification.getReadAt())
                .link(notification.getLink())
                .entityType(notification.getEntityType())
                .entityId(notification.getEntityId())
                .createdAt(notification.getCreatedAt())
                .timeAgo(getTimeAgo(notification.getCreatedAt()))
                .build();
    }

    // ===== GET TIME AGO =====
    private String getTimeAgo(LocalDateTime dateTime) {
        if (dateTime == null) return "";
        LocalDateTime now = LocalDateTime.now();
        long minutes = ChronoUnit.MINUTES.between(dateTime, now);
        long hours = ChronoUnit.HOURS.between(dateTime, now);
        long days = ChronoUnit.DAYS.between(dateTime, now);

        if (minutes < 1) return "Just now";
        if (minutes < 60) return minutes + "m ago";
        if (hours < 24) return hours + "h ago";
        if (days < 7) return days + "d ago";
        return dateTime.toLocalDate().toString();
    }
    // ============================================
    // GET NOTIFICATIONS BY USER
    // ============================================
    public List<AdminNotificationDTO> getNotificationsByUser(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        List<Notification> notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
        return notifications.stream()
                .map(notification -> convertToAdminDTOFromEntity(notification))
                .collect(Collectors.toList());
    }

    // ============================================
    // GET NOTIFICATIONS BY DATE RANGE
    // ============================================
    public List<AdminNotificationDTO> getNotificationsByDateRange(String startDate, String endDate) {
        LocalDateTime start = LocalDateTime.parse(startDate + "T00:00:00");
        LocalDateTime end = LocalDateTime.parse(endDate + "T23:59:59");

        List<Notification> notifications = notificationRepository.findByCreatedAtBetween(start, end);
        return notifications.stream()
                .map(notification -> convertToAdminDTOFromEntity(notification))
                .collect(Collectors.toList());
    }

    // ============================================
    // BROADCAST TO ROLE
    // ============================================
    @Transactional
    public void broadcastToRole(BroadcastNotificationRequest request, String role, String adminEmail) {
        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Admin not found"));

        List<User> users = userRepository.findByRole(role);

        if (users.isEmpty()) {
            throw new RuntimeException("No users found with role: " + role);
        }

        for (User user : users) {
            Notification notification = Notification.builder()
                    .user(user)
                    .sender(admin)
                    .senderName(admin.getFullName())
                    .title(request.getTitle())
                    .message(request.getMessage())
                    .type(NotificationType.valueOf(request.getType().toUpperCase()))
                    .isRead(false)
                    .entityType("ADMIN_BROADCAST")
                    .createdAt(LocalDateTime.now())
                    .build();

            notificationRepository.save(notification);
        }

        log.info("📬 Broadcast notification sent to {} users with role: {}", users.size(), role);
    }

    // ============================================
    // BROADCAST TO USER
    // ============================================
    @Transactional
    public void broadcastToUser(BroadcastNotificationRequest request, String userId, String adminEmail) {
        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Admin not found"));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        Notification notification = Notification.builder()
                .user(user)
                .sender(admin)
                .senderName(admin.getFullName())
                .title(request.getTitle())
                .message(request.getMessage())
                .type(NotificationType.valueOf(request.getType().toUpperCase()))
                .isRead(false)
                .entityType("ADMIN_BROADCAST")
                .createdAt(LocalDateTime.now())
                .build();

        notificationRepository.save(notification);
        log.info("📬 Broadcast notification sent to user: {}", user.getEmail());
    }

    // ============================================
    // GET TOP USERS WITH NOTIFICATIONS
    // ============================================
    public Map<String, Long> getTopUsersWithNotifications(int limit) {
        List<Object[]> results = notificationRepository.findTopUsersWithNotifications(limit);

        Map<String, Long> topUsers = new LinkedHashMap<>();
        for (Object[] result : results) {
            String userId = (String) result[0];
            Long count = (Long) result[1];

            User user = userRepository.findById(userId).orElse(null);
            if (user != null) {
                topUsers.put(user.getFullName() + " (" + user.getEmail() + ")", count);
            }
        }
        return topUsers;
    }

    // ============================================
    // GET NOTIFICATION TYPE DISTRIBUTION
    // ============================================
    public Map<String, Long> getNotificationTypeDistribution() {
        List<Object[]> results = notificationRepository.findNotificationTypeDistribution();

        Map<String, Long> distribution = new LinkedHashMap<>();
        for (Object[] result : results) {
            String type = (String) result[0];
            Long count = (Long) result[1];
            distribution.put(type, count);
        }
        return distribution;
    }

    // ============================================
    // DELETE NOTIFICATIONS OLDER THAN DAYS
    // ============================================
    @Transactional
    public void deleteNotificationsOlderThan(int days) {
        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(days);
        int deletedCount = notificationRepository.deleteByCreatedAtBefore(cutoffDate);
        log.info("🗑️ Deleted {} notifications older than {} days", deletedCount, days);
    }

    // ============================================
    // SEARCH NOTIFICATIONS
    // ============================================
    public Page<AdminNotificationDTO> searchNotifications(String keyword, String type, Pageable pageable) {
        Page<Notification> notifications;

        if (keyword != null && !keyword.isEmpty() && type != null && !type.isEmpty()) {
            // Search by both keyword and type
            notifications = notificationRepository.findByTitleContainingIgnoreCaseAndType(
                    keyword, NotificationType.valueOf(type.toUpperCase()), pageable);
        } else if (keyword != null && !keyword.isEmpty()) {
            // Search by keyword only
            notifications = notificationRepository.findByTitleContainingIgnoreCaseOrMessageContainingIgnoreCase(
                    keyword, keyword, pageable);
        } else if (type != null && !type.isEmpty()) {
            // Search by type only
            notifications = notificationRepository.findByType(NotificationType.valueOf(type.toUpperCase()), pageable);
        } else {
            // No filters
            notifications = notificationRepository.findAll(pageable);
        }

        return notifications.map(notification -> convertToAdminDTOFromEntity(notification));
    }

    // ============================================
    // MARK NOTIFICATION AS READ (ADMIN)
    // ============================================
    @Transactional
    public void markNotificationAsRead(String notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found with id: " + notificationId));

        notification.setIsRead(true);
        notification.setReadAt(LocalDateTime.now());
        notificationRepository.save(notification);
        log.info("✅ Notification marked as read: {}", notificationId);
    }
    // ===== CONVERT TO ADMIN DTO FROM ENTITY =====
    private AdminNotificationDTO convertToAdminDTOFromEntity(Notification notification) {
        User user = notification.getUser();
        return AdminNotificationDTO.builder()
                .id(notification.getId())
                .userId(user.getId())
                .userFullName(user.getFullName())
                .userEmail(user.getEmail())
                .senderName(notification.getSenderName() != null ? notification.getSenderName() : "System")
                .title(notification.getTitle())
                .message(notification.getMessage())
                .type(notification.getType() != null ? notification.getType().name() : "GENERAL")
                .isRead(notification.getIsRead() != null ? notification.getIsRead() : false)
                .readAt(notification.getReadAt())
                .link(notification.getLink())
                .entityType(notification.getEntityType())
                .entityId(notification.getEntityId())
                .createdAt(notification.getCreatedAt())
                .timeAgo(getTimeAgo(notification.getCreatedAt()))
                .build();
    }
}