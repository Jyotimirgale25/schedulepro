// src/main/java/com/schedulepro/employee/service/NotificationService.java
package com.schedulepro.employee.service;

import com.schedulepro.auth.entity.User;
import com.schedulepro.auth.repository.UserRepository;
import com.schedulepro.common.exception.ResourceNotFoundException;
import com.schedulepro.common.exception.UnauthorizedException;
import com.schedulepro.employee.dto.request.CreateNotificationRequest;
import com.schedulepro.employee.dto.response.NotificationDTO;
import com.schedulepro.employee.entity.Notification;
import com.schedulepro.employee.entity.NotificationType;
import com.schedulepro.employee.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final ApplicationEventPublisher eventPublisher;  // ✅ Use event publisher instead

    // ===== CREATE NOTIFICATION =====
    @Transactional
    public NotificationDTO createNotification(CreateNotificationRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        User sender = null;
        String senderName = null;

        if (request.getSenderId() != null) {
            sender = userRepository.findById(request.getSenderId()).orElse(null);
            if (sender != null) {
                senderName = sender.getFullName();
            }
        }

        if (request.getSenderName() != null) {
            senderName = request.getSenderName();
        }

        NotificationType notificationType = NotificationType.GENERAL;
        if (request.getType() != null) {
            try {
                notificationType = NotificationType.valueOf(request.getType().toUpperCase());
            } catch (IllegalArgumentException e) {
                log.warn("Invalid notification type: {}, using GENERAL", request.getType());
                notificationType = NotificationType.GENERAL;
            }
        }

        Notification notification = Notification.builder()
                .user(user)
                .sender(sender)
                .senderName(senderName)
                .title(request.getTitle())
                .message(request.getMessage())
                .type(notificationType)
                .isRead(false)
                .link(request.getLink())
                .entityType(request.getEntityType())
                .entityId(request.getEntityId())
                .createdAt(LocalDateTime.now())
                .build();

        Notification saved = notificationRepository.save(notification);
        log.info("📬 Notification created for user: {}, from: {}", user.getEmail(), senderName != null ? senderName : "System");

        // ✅ Publish event instead of calling controller directly
        NotificationDTO dto = mapToDTO(saved);
        eventPublisher.publishEvent(new NotificationCreatedEvent(dto, user.getId()));

        return dto;
    }

    // ===== GET USER NOTIFICATIONS =====
    public List<NotificationDTO> getUserNotifications(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public Page<NotificationDTO> getUserNotificationsPaginated(String email, Pageable pageable) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId(), pageable)
                .map(this::mapToDTO);
    }

    // ===== GET UNREAD COUNT =====
    public int getUnreadCount(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return (int) notificationRepository.countUnreadByUserId(user.getId());
    }

    // ===== GET UNREAD NOTIFICATIONS =====
    public List<NotificationDTO> getUnreadNotifications(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    // ===== MARK AS READ =====
    @Transactional
    public void markAsRead(String notificationId, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        notificationRepository.markAsReadByUserId(notificationId, user.getId());
        log.info("📬 Notification marked as read: {}", notificationId);
    }

    // ===== MARK ALL AS READ =====
    @Transactional
    public void markAllAsRead(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        notificationRepository.markAllAsReadByUserId(user.getId());
        log.info("📬 All notifications marked as read for user: {}", email);
    }

    // ===== DELETE NOTIFICATION =====
    @Transactional
    public void deleteNotification(String notificationId, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));

        if (!notification.getUser().getId().equals(user.getId())) {
            throw new UnauthorizedException("You don't have permission to delete this notification");
        }

        notificationRepository.delete(notification);
        log.info("📬 Notification deleted: {}", notificationId);
    }

    // ===== DELETE ALL NOTIFICATIONS =====
    @Transactional
    public void deleteAllNotifications(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        notificationRepository.deleteByUserId(user.getId());
        log.info("📬 All notifications deleted for user: {}", email);
    }

    // ===== CREATE NOTIFICATION BY EMAIL =====
    @Transactional
    public void createNotification(String userEmail, String title, String message, String type) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        NotificationType notificationType = NotificationType.GENERAL;
        if (type != null) {
            try {
                notificationType = NotificationType.valueOf(type.toUpperCase());
            } catch (IllegalArgumentException e) {
                log.warn("Invalid notification type: {}, using GENERAL", type);
            }
        }

        Notification notification = Notification.builder()
                .user(user)
                .title(title)
                .message(message)
                .type(notificationType)
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .build();

        Notification saved = notificationRepository.save(notification);
        log.info("📬 Notification created for user: {}", userEmail);

        // ✅ Publish event
        NotificationDTO dto = mapToDTO(saved);
        eventPublisher.publishEvent(new NotificationCreatedEvent(dto, user.getId()));
    }

    // ===== INNER EVENT CLASS =====
    public static class NotificationCreatedEvent {
        private final NotificationDTO notification;
        private final String userId;

        public NotificationCreatedEvent(NotificationDTO notification, String userId) {
            this.notification = notification;
            this.userId = userId;
        }

        public NotificationDTO getNotification() { return notification; }
        public String getUserId() { return userId; }
    }

    // ===== HELPER METHODS =====
    private NotificationDTO mapToDTO(Notification notification) {
        return NotificationDTO.builder()
                .id(notification.getId())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .type(notification.getType() != null ? notification.getType().name() : "GENERAL")
                .isRead(notification.getIsRead())
                .readAt(notification.getReadAt())
                .link(notification.getLink())
                .entityType(notification.getEntityType())
                .entityId(notification.getEntityId())
                .senderId(notification.getSender() != null ? notification.getSender().getId() : null)
                .senderName(notification.getSenderName())
                .createdAt(notification.getCreatedAt())
                .timeAgo(getTimeAgo(notification.getCreatedAt()))
                .build();
    }

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
    // GET NOTIFICATIONS BY TYPE
    // ============================================
    public List<NotificationDTO> getNotificationsByType(String email, String type) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        List<Notification> notifications = notificationRepository
                .findByUserIdAndTypeOrderByCreatedAtDesc(user.getId(), type);

        return notifications.stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    // ============================================
    // GET RECENT NOTIFICATIONS
    // ============================================
    public List<NotificationDTO> getRecentNotifications(String email, int limit) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Pageable pageable = PageRequest.of(0, limit, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Notification> notifications = notificationRepository
                .findByUserId(user.getId(), pageable);

        return notifications.getContent().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    // ============================================
    // MARK ALL BY TYPE AS READ
    // ============================================
    public void markAllByTypeAsRead(String email, String type) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        List<Notification> notifications = notificationRepository
                .findByUserIdAndTypeAndIsReadFalse(user.getId(), type);

        for (Notification notification : notifications) {
            notification.setIsRead(true);
        }
        notificationRepository.saveAll(notifications);
        log.info("✅ Marked all {} notifications as read for user: {}", type, email);
    }
    // ============================================
    // BULK DELETE NOTIFICATIONS
    // ============================================
    public void bulkDeleteNotifications(List<String> notificationIds, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        List<Notification> notifications = notificationRepository
                .findAllById(notificationIds);

        // Verify all notifications belong to the user
        for (Notification notification : notifications) {
            if (!notification.getUser().getId().equals(user.getId())) {
                throw new RuntimeException("Unauthorized: Notification does not belong to user");
            }
        }

        notificationRepository.deleteAll(notifications);
        log.info("✅ Deleted {} notifications for user: {}", notificationIds.size(), email);
    }

}