// src/main/java/com/schedulepro/employee/controller/NotificationController.java
package com.schedulepro.employee.controller;

import com.schedulepro.auth.entity.User;
import com.schedulepro.auth.repository.UserRepository;
import com.schedulepro.common.exception.ResourceNotFoundException;
import com.schedulepro.employee.dto.response.NotificationDTO;
import com.schedulepro.employee.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/employee/notifications")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasRole('EMPLOYEE') or hasRole('MANAGER') or hasRole('ADMIN')")
public class NotificationController {

    private final NotificationService notificationService;
    private final UserRepository userRepository;
    private final Map<String, SseEmitter> emitters = new ConcurrentHashMap<>();

    // ===== GET ALL NOTIFICATIONS =====
    @GetMapping
    public ResponseEntity<List<NotificationDTO>> getNotifications() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        log.info("📬 GET /api/employee/notifications - Fetching all notifications for: {}", email);
        return ResponseEntity.ok(notificationService.getUserNotifications(email));
    }

    // ===== GET NOTIFICATIONS WITH PAGINATION =====
    @GetMapping("/paged")
    public ResponseEntity<Page<NotificationDTO>> getNotificationsPaginated(
            @PageableDefault(size = 20, sort = "createdAt") Pageable pageable) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        log.info("📬 GET /api/employee/notifications/paged - Fetching paginated notifications for: {}", email);
        return ResponseEntity.ok(notificationService.getUserNotificationsPaginated(email, pageable));
    }

    // ===== GET UNREAD COUNT =====
    @GetMapping("/unread/count")
    public ResponseEntity<Map<String, Integer>> getUnreadCount() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        log.info("📬 GET /api/employee/notifications/unread/count - Fetching unread count for: {}", email);
        int count = notificationService.getUnreadCount(email);
        Map<String, Integer> response = new HashMap<>();
        response.put("count", count);
        return ResponseEntity.ok(response);
    }

    // ===== GET UNREAD NOTIFICATIONS =====
    @GetMapping("/unread")
    public ResponseEntity<List<NotificationDTO>> getUnreadNotifications() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        log.info("📬 GET /api/employee/notifications/unread - Fetching unread notifications for: {}", email);
        return ResponseEntity.ok(notificationService.getUnreadNotifications(email));
    }

    // ===== MARK AS READ =====
    @PutMapping("/{id}/read")
    public ResponseEntity<Map<String, String>> markAsRead(@PathVariable String id) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        log.info("📬 PUT /api/employee/notifications/{}/read - Marking notification as read for: {}", id, email);
        notificationService.markAsRead(id, email);

        Map<String, String> response = new HashMap<>();
        response.put("message", "Notification marked as read");
        return ResponseEntity.ok(response);
    }

    // ===== MARK ALL AS READ =====
    @PutMapping("/read-all")
    public ResponseEntity<Map<String, String>> markAllAsRead() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        log.info("📬 PUT /api/employee/notifications/read-all - Marking all notifications as read for: {}", email);
        notificationService.markAllAsRead(email);

        Map<String, String> response = new HashMap<>();
        response.put("message", "All notifications marked as read");
        return ResponseEntity.ok(response);
    }

    // ===== DELETE NOTIFICATION =====
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteNotification(@PathVariable String id) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        log.info("📬 DELETE /api/employee/notifications/{} - Deleting notification for: {}", id, email);
        notificationService.deleteNotification(id, email);

        Map<String, String> response = new HashMap<>();
        response.put("message", "Notification deleted successfully");
        return ResponseEntity.ok(response);
    }

    // ===== DELETE ALL NOTIFICATIONS =====
    @DeleteMapping("/clear-all")
    public ResponseEntity<Map<String, String>> deleteAllNotifications() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        log.info("📬 DELETE /api/employee/notifications/clear-all - Deleting all notifications for: {}", email);
        notificationService.deleteAllNotifications(email);

        Map<String, String> response = new HashMap<>();
        response.put("message", "All notifications deleted successfully");
        return ResponseEntity.ok(response);
    }

    // ===== CREATE NOTIFICATION (ADMIN/MANAGER ONLY) =====
    @PostMapping
    @PreAuthorize("hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> createNotification(
            @RequestBody Map<String, String> request) {

        String userEmail = request.get("userEmail");
        String title = request.get("title");
        String message = request.get("message");
        String type = request.getOrDefault("type", "GENERAL");

        log.info("📬 POST /api/employee/notifications - Creating notification for: {}", userEmail);

        notificationService.createNotification(userEmail, title, message, type);

        Map<String, String> response = new HashMap<>();
        response.put("message", "Notification created successfully");
        return ResponseEntity.ok(response);
    }

    // ===== SSE STREAM FOR REAL-TIME NOTIFICATIONS =====
    @GetMapping("/stream")
    @PreAuthorize("isAuthenticated()")
    public SseEmitter streamNotifications() {
        String userId = getCurrentUserId();
        log.info("📡 SSE connection established for user: {}", userId);

        SseEmitter emitter = new SseEmitter(60000L); // 60 seconds timeout

        emitters.put(userId, emitter);

        emitter.onCompletion(() -> {
            emitters.remove(userId);
            log.info("📡 SSE connection closed for user: {}", userId);
        });
        emitter.onTimeout(() -> {
            emitters.remove(userId);
            log.info("📡 SSE connection timed out for user: {}", userId);
        });

        return emitter;
    }

    // ===== BROADCAST NOTIFICATION TO SPECIFIC USER =====
    public void sendNotificationToUser(String userId, NotificationDTO notification) {
        SseEmitter emitter = emitters.get(userId);
        if (emitter != null) {
            try {
                emitter.send(SseEmitter.event()
                        .name("notification")
                        .data(notification));
                log.info("📬 Notification sent via SSE to user: {}", userId);
            } catch (Exception e) {
                emitters.remove(userId);
                log.error("❌ Failed to send SSE notification: {}", e.getMessage());
            }
        }
    }

    // ===== BROADCAST NOTIFICATION TO MULTIPLE USERS =====
    public void sendNotificationToUsers(List<String> userIds, NotificationDTO notification) {
        for (String userId : userIds) {
            sendNotificationToUser(userId, notification);
        }
    }

    // ===== HELPER METHOD TO GET CURRENT USER ID =====
    private String getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return user.getId();
    }
    // ===== GET NOTIFICATIONS BY TYPE =====
    @GetMapping("/type/{type}")
    public ResponseEntity<List<NotificationDTO>> getNotificationsByType(@PathVariable String type) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        log.info("📬 GET /api/employee/notifications/type/{} - Fetching notifications by type for: {}", type, email);
        return ResponseEntity.ok(notificationService.getNotificationsByType(email, type));
    }
    // ===== GET RECENT NOTIFICATIONS (Last 5) =====
    @GetMapping("/recent")
    public ResponseEntity<List<NotificationDTO>> getRecentNotifications() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        log.info("📬 GET /api/employee/notifications/recent - Fetching recent notifications for: {}", email);
        return ResponseEntity.ok(notificationService.getRecentNotifications(email, 5));
    }
    // ===== MARK ALL NOTIFICATIONS BY TYPE AS READ =====
    @PutMapping("/read-by-type/{type}")
    public ResponseEntity<Map<String, String>> markAllByTypeAsRead(@PathVariable String type) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        log.info("📬 PUT /api/employee/notifications/read-by-type/{} - Marking all {} notifications as read for: {}",
                type, type, email);
        notificationService.markAllByTypeAsRead(email, type);

        Map<String, String> response = new HashMap<>();
        response.put("message", "All " + type + " notifications marked as read");
        return ResponseEntity.ok(response);
    }
    // ===== BULK DELETE NOTIFICATIONS =====
    @DeleteMapping("/bulk-delete")
    public ResponseEntity<Map<String, String>> bulkDeleteNotifications(
            @RequestBody List<String> notificationIds) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        log.info("📬 DELETE /api/employee/notifications/bulk-delete - Deleting {} notifications for: {}",
                notificationIds.size(), email);
        notificationService.bulkDeleteNotifications(notificationIds, email);

        Map<String, String> response = new HashMap<>();
        response.put("message", notificationIds.size() + " notifications deleted successfully");
        return ResponseEntity.ok(response);
    }
}