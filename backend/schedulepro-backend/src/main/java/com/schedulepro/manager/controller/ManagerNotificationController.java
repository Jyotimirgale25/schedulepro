// src/main/java/com/schedulepro/manager/controller/ManagerNotificationController.java
package com.schedulepro.manager.controller;

import com.schedulepro.auth.entity.User;
import com.schedulepro.auth.repository.UserRepository;
import com.schedulepro.common.exception.ResourceNotFoundException;
import com.schedulepro.employee.service.NotificationHelper;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/manager/notifications")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasRole('MANAGER') or hasRole('ADMIN')")
public class ManagerNotificationController {

    private final NotificationHelper notificationHelper;
    private final UserRepository userRepository;

    @PostMapping("/team/{userId}")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<?> sendToTeamMember(
            @PathVariable String userId,
            @RequestBody Map<String, String> request) {

        try {
            User manager = getCurrentUser();
            log.info("📤 Manager {} sending notification to user {}", manager.getEmail(), userId);

            User target = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));

            // Verify target is in manager's team
            if (!manager.getId().equals(target.getManagerId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "User is not in your team"));
            }

            notificationHelper.createNotification(
                    userId,
                    manager.getId(),
                    manager.getFullName(),
                    request.get("title"),
                    request.get("message"),
                    "INFO",
                    "MANAGER"
            );

            Map<String, String> response = new HashMap<>();
            response.put("message", "Notification sent to " + target.getFullName());
            response.put("success", "true");
            return ResponseEntity.ok(response);

        } catch (ResourceNotFoundException e) {
            log.error("❌ User not found: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("❌ Error sending notification: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to send notification"));
        }
    }

    @PostMapping("/team")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<?> sendToTeam(
            @RequestBody Map<String, String> request) {

        try {
            User manager = getCurrentUser();
            log.info("📤 Manager {} sending notification to team", manager.getEmail());

            List<User> teamMembers = userRepository.findByManagerId(manager.getId());

            if (teamMembers.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "No team members found"));
            }

            for (User member : teamMembers) {
                notificationHelper.createNotification(
                        member.getId(),
                        manager.getId(),
                        manager.getFullName(),
                        request.get("title"),
                        request.get("message"),
                        "INFO",
                        "MANAGER"
                );
            }

            Map<String, String> response = new HashMap<>();
            response.put("message", "Notification sent to " + teamMembers.size() + " team members");
            response.put("success", "true");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("❌ Error sending notification: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to send notification"));
        }
    }

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    // ============================================
    // SEND SCHEDULE UPDATE TO TEAM
    // ============================================
    @PostMapping("/team/schedule-update")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<?> sendScheduleUpdate(
            @RequestBody Map<String, String> request) {

        try {
            User manager = getCurrentUser();
            String scheduleDate = request.get("scheduleDate");

            List<User> teamMembers = userRepository.findByManagerId(manager.getId());

            if (teamMembers.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "No team members found"));
            }

            for (User member : teamMembers) {
                notificationHelper.notifyScheduleUpdated(
                        member.getId(),
                        manager.getId(),
                        manager.getFullName(),
                        scheduleDate
                );
            }

            Map<String, String> response = new HashMap<>();
            response.put("message", "Schedule update sent to " + teamMembers.size() + " team members");
            response.put("success", "true");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("❌ Error sending schedule update: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to send schedule update"));
        }
    }
    // ============================================
    // SEND SHIFT ASSIGNMENT NOTIFICATION
    // ============================================
    @PostMapping("/team/shift-assign")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<?> sendShiftAssignment(
            @RequestBody Map<String, String> request) {

        try {
            User manager = getCurrentUser();
            String userId = request.get("userId");
            String shiftTime = request.get("shiftTime");
            String date = request.get("date");

            User target = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));

            // Verify target is in manager's team
            if (!manager.getId().equals(target.getManagerId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "User is not in your team"));
            }

            notificationHelper.notifyShiftAssigned(
                    userId,
                    manager.getId(),
                    manager.getFullName(),
                    shiftTime,
                    date
            );

            Map<String, String> response = new HashMap<>();
            response.put("message", "Shift assignment notification sent to " + target.getFullName());
            response.put("success", "true");
            return ResponseEntity.ok(response);

        } catch (ResourceNotFoundException e) {
            log.error("❌ User not found: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("❌ Error sending shift assignment: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to send shift assignment"));
        }
    }
    // ============================================
    // SEND ANNOUNCEMENT TO TEAM
    // ============================================
    @PostMapping("/team/announcement")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<?> sendAnnouncement(
            @RequestBody Map<String, String> request) {

        try {
            User manager = getCurrentUser();
            String title = request.get("title");

            List<User> teamMembers = userRepository.findByManagerId(manager.getId());

            if (teamMembers.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "No team members found"));
            }

            for (User member : teamMembers) {
                notificationHelper.notifyNewAnnouncement(
                        member.getId(),
                        title
                );
            }

            Map<String, String> response = new HashMap<>();
            response.put("message", "Announcement sent to " + teamMembers.size() + " team members");
            response.put("success", "true");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("❌ Error sending announcement: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to send announcement"));
        }
    }
    @PostConstruct
    public void init() {
        log.info("✅ ManagerNotificationController loaded successfully!");
    }
}