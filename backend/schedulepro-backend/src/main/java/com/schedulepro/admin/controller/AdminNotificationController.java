// src/main/java/com/schedulepro/admin/controller/AdminNotificationController.java
package com.schedulepro.admin.controller;

import com.schedulepro.admin.dto.request.BroadcastNotificationRequest;
import com.schedulepro.admin.dto.response.AdminNotificationDTO;
import com.schedulepro.admin.dto.response.NotificationStatsDTO;
import com.schedulepro.admin.service.AdminNotificationService;
import com.schedulepro.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/notifications")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
@Slf4j
public class AdminNotificationController {

    private final AdminNotificationService adminNotificationService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<AdminNotificationDTO>>> getAllNotifications() {
        log.info("GET /api/admin/notifications - Fetching all notifications");
        List<AdminNotificationDTO> notifications = adminNotificationService.getAllNotifications();
        return ResponseEntity.ok(ApiResponse.success("Notifications fetched successfully", notifications));
    }

    @GetMapping("/paginated")
    public ResponseEntity<ApiResponse<Page<AdminNotificationDTO>>> getNotificationsPaginated(
            @PageableDefault(size = 20, sort = "createdAt") Pageable pageable) {
        log.info("GET /api/admin/notifications/paginated - Fetching paginated notifications");
        Page<AdminNotificationDTO> notifications = adminNotificationService.getAllNotificationsPaginated(pageable);
        return ResponseEntity.ok(ApiResponse.success("Notifications fetched successfully", notifications));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AdminNotificationDTO>> getNotificationById(@PathVariable String id) {
        log.info("GET /api/admin/notifications/{} - Fetching notification", id);
        AdminNotificationDTO notification = adminNotificationService.getNotificationById(id);
        return ResponseEntity.ok(ApiResponse.success("Notification fetched successfully", notification));
    }

    @GetMapping("/type/{type}")
    public ResponseEntity<ApiResponse<List<AdminNotificationDTO>>> getNotificationsByType(@PathVariable String type) {
        log.info("GET /api/admin/notifications/type/{} - Fetching notifications by type", type);
        List<AdminNotificationDTO> notifications = adminNotificationService.getNotificationsByType(type);
        return ResponseEntity.ok(ApiResponse.success("Notifications fetched successfully", notifications));
    }

    @PostMapping("/broadcast")
    public ResponseEntity<ApiResponse<Void>> broadcastNotification(
            @Valid @RequestBody BroadcastNotificationRequest request,
            Authentication authentication) {
        String adminEmail = authentication.getName();
        log.info("POST /api/admin/notifications/broadcast - Broadcasting notification");
        adminNotificationService.broadcastNotification(request, adminEmail);
        return ResponseEntity.ok(ApiResponse.success("Broadcast notification sent successfully", null));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteNotification(@PathVariable String id) {
        log.info("DELETE /api/admin/notifications/{} - Deleting notification", id);
        adminNotificationService.deleteNotification(id);
        return ResponseEntity.ok(ApiResponse.success("Notification deleted successfully", null));
    }

    @DeleteMapping("/all")
    public ResponseEntity<ApiResponse<Void>> deleteAllNotifications() {
        log.info("DELETE /api/admin/notifications/all - Deleting all notifications");
        adminNotificationService.deleteAllNotifications();
        return ResponseEntity.ok(ApiResponse.success("All notifications deleted successfully", null));
    }

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<NotificationStatsDTO>> getNotificationStats() {
        log.info("GET /api/admin/notifications/stats - Fetching notification statistics");
        long total = adminNotificationService.getTotalNotificationCount();
        long unread = adminNotificationService.getUnreadNotificationCount();

        NotificationStatsDTO stats = NotificationStatsDTO.builder()
                .totalNotifications(total)
                .unreadNotifications(unread)
                .readNotifications(total - unread)
                .build();

        return ResponseEntity.ok(ApiResponse.success("Notification stats fetched successfully", stats));
    }
    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<List<AdminNotificationDTO>>> getNotificationsByUser(@PathVariable String userId) {
        log.info("GET /api/admin/notifications/user/{} - Fetching notifications for user", userId);
        List<AdminNotificationDTO> notifications = adminNotificationService.getNotificationsByUser(userId);
        return ResponseEntity.ok(ApiResponse.success("Notifications fetched successfully", notifications));
    }
    @GetMapping("/date-range")
    public ResponseEntity<ApiResponse<List<AdminNotificationDTO>>> getNotificationsByDateRange(
            @RequestParam String startDate,
            @RequestParam String endDate) {
        log.info("GET /api/admin/notifications/date-range - Fetching notifications between {} and {}", startDate, endDate);
        List<AdminNotificationDTO> notifications = adminNotificationService.getNotificationsByDateRange(startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success("Notifications fetched successfully", notifications));
    }
    @PostMapping("/broadcast/role/{role}")
    public ResponseEntity<ApiResponse<Void>> broadcastToRole(
            @PathVariable String role,
            @Valid @RequestBody BroadcastNotificationRequest request,
            Authentication authentication) {
        String adminEmail = authentication.getName();
        log.info("POST /api/admin/notifications/broadcast/role/{} - Broadcasting notification to role", role);
        adminNotificationService.broadcastToRole(request, role, adminEmail);
        return ResponseEntity.ok(ApiResponse.success("Broadcast notification sent to " + role + "s successfully", null));
    }
    @PostMapping("/broadcast/user/{userId}")
    public ResponseEntity<ApiResponse<Void>> broadcastToUser(
            @PathVariable String userId,
            @Valid @RequestBody BroadcastNotificationRequest request,
            Authentication authentication) {
        String adminEmail = authentication.getName();
        log.info("POST /api/admin/notifications/broadcast/user/{} - Broadcasting notification to user", userId);
        adminNotificationService.broadcastToUser(request, userId, adminEmail);
        return ResponseEntity.ok(ApiResponse.success("Broadcast notification sent to user successfully", null));
    }
    @PutMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Void>> markNotificationAsRead(@PathVariable String id) {
        log.info("PUT /api/admin/notifications/{}/read - Marking notification as read", id);
        adminNotificationService.markNotificationAsRead(id);
        return ResponseEntity.ok(ApiResponse.success("Notification marked as read", null));
    }
    @GetMapping("/unread/count")
    public ResponseEntity<ApiResponse<Long>> getUnreadCount() {
        log.info("GET /api/admin/notifications/unread/count - Fetching unread count");
        long count = adminNotificationService.getUnreadNotificationCount();
        return ResponseEntity.ok(ApiResponse.success("Unread count fetched successfully", count));
    }
    @GetMapping("/top-users")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getTopUsersWithNotifications(
            @RequestParam(defaultValue = "10") int limit) {
        log.info("GET /api/admin/notifications/top-users - Fetching top {} users with notifications", limit);
        Map<String, Long> topUsers = adminNotificationService.getTopUsersWithNotifications(limit);
        return ResponseEntity.ok(ApiResponse.success("Top users fetched successfully", topUsers));
    }
    @GetMapping("/types/distribution")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getNotificationTypeDistribution() {
        log.info("GET /api/admin/notifications/types/distribution - Fetching notification type distribution");
        Map<String, Long> distribution = adminNotificationService.getNotificationTypeDistribution();
        return ResponseEntity.ok(ApiResponse.success("Notification type distribution fetched successfully", distribution));
    }
    @DeleteMapping("/cleanup/{days}")
    public ResponseEntity<ApiResponse<Void>> deleteNotificationsOlderThan(@PathVariable int days) {
        log.info("DELETE /api/admin/notifications/cleanup/{} - Deleting notifications older than {} days", days, days);
        adminNotificationService.deleteNotificationsOlderThan(days);
        return ResponseEntity.ok(ApiResponse.success("Notifications older than " + days + " days deleted successfully", null));
    }
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<Page<AdminNotificationDTO>>> searchNotifications(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String type,
            @PageableDefault(size = 20, sort = "createdAt") Pageable pageable) {
        log.info("GET /api/admin/notifications/search - Searching notifications with keyword: {}, type: {}", keyword, type);
        Page<AdminNotificationDTO> results = adminNotificationService.searchNotifications(keyword, type, pageable);
        return ResponseEntity.ok(ApiResponse.success("Search results fetched successfully", results));
    }


}