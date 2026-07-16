// src/main/java/com/schedulepro/employee/service/NotificationHelper.java
package com.schedulepro.employee.service;

import com.schedulepro.employee.dto.request.CreateNotificationRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationHelper {

    private final NotificationService notificationService;

    // ============================================
    // BASE CREATE NOTIFICATION METHOD
    // ============================================

    public void createNotification(String userId, String senderId, String senderName,
                                   String title, String message, String type, String entityType) {
        try {
    CreateNotificationRequest request = CreateNotificationRequest.builder()
            .userId(userId)
            .senderId(senderId)
            .senderName(senderName)
            .title(title)
            .message(message)
            .type(type)
            .entityType(entityType)

            .build();

            notificationService.createNotification(request);
            log.info("📬 Notification created for user {} from {}: {}", userId, senderName, title);
} catch (Exception e) {
        log.error("❌ Failed to create notification: {}", e.getMessage());
        }
        }
    // ============================================
    // LEAVE NOTIFICATIONS
    // ============================================

    public void notifyLeaveSubmitted(String userId, String senderId, String senderName,
                                     String leaveType, String startDate) {
        createNotification(
                userId,
                senderId,
                senderName,
                "Leave Request Submitted 📋",
                String.format("%s submitted a %s leave request starting %s.",
                        senderName, leaveType, startDate),
                "INFO",
                "LEAVE"
        );
    }

    public void notifyLeaveApproved(String userId, String senderId, String senderName,
                                    String leaveType, String startDate) {
        createNotification(
                userId,
                senderId,
                senderName,
                "Leave Request Approved 🎉",
                String.format("%s approved your %s leave request for %s.",
                        senderName, leaveType, startDate),
                "SUCCESS",
                "LEAVE"
        );
    }

    public void notifyLeaveRejected(String userId, String senderId, String senderName,
                                    String leaveType, String startDate, String reason) {
        createNotification(
                userId,
                senderId,
                senderName,
                "Leave Request Rejected ❌",
                String.format("%s rejected your %s leave request for %s. Reason: %s",
                        senderName, leaveType, startDate, reason),
                "ERROR",
                "LEAVE"
        );
    }

    // ============================================
    // SWAP NOTIFICATIONS
    // ============================================

    public void notifySwapRequested(String userId, String senderId, String senderName, String date) {
        createNotification(
                userId,
                senderId,
                senderName,
                "Shift Swap Requested 🔄",
                String.format("%s requested a shift swap for %s.",
                        senderName, date),
                "INFO",
                "SWAP"
        );
    }

    public void notifySwapRequestReceived(String userId, String senderId, String senderName, String date) {
        createNotification(
                userId,
                senderId,
                senderName,
                "Shift Swap Request Received 📩",
                String.format("%s has requested a shift swap with you for %s.",
                        senderName, date),
                "INFO",
                "SWAP"
        );
    }

    public void notifySwapAccepted(String userId, String senderId, String senderName, String date) {
        createNotification(
                userId,
                senderId,
                senderName,
                "Shift Swap Accepted ✅",
                String.format("%s accepted your shift swap request for %s.",
                        senderName, date),
                "SUCCESS",
                "SWAP"
        );
    }

    public void notifySwapRejected(String userId, String senderId, String senderName, String date) {
        createNotification(
                userId,
                senderId,
                senderName,
                "Shift Swap Rejected ❌",
                String.format("%s rejected your shift swap request for %s.",
                        senderName, date),
                "ERROR",
                "SWAP"
        );
    }

    public void notifySwapApprovedByManager(String userId, String senderId, String senderName, String date) {
        createNotification(
                userId,
                senderId,
                senderName,
                "Shift Swap Approved by Manager 🎉",
                String.format("%s approved your shift swap for %s.",
                        senderName, date),
                "SUCCESS",
                "SWAP"
        );
    }


    // ============================================
    // SCHEDULE NOTIFICATIONS
    // ============================================

    public void notifySchedulePublished(String userId, String senderId, String senderName,
                                        String scheduleDate) {
        createNotification(
                userId,
                senderId,
                senderName,
                "Schedule Published 📅",
                String.format("%s has published the schedule for %s.",
                        senderName, scheduleDate),
                "INFO",
                "SCHEDULE"
        );
    }

    public void notifyScheduleUpdated(String userId, String senderId, String senderName,
                                      String scheduleDate) {
        createNotification(
                userId,
                senderId,
                senderName,
                "Schedule Updated 🔄",
                String.format("%s has updated the schedule for %s.",
                        senderName, scheduleDate),
                "INFO",
                "SCHEDULE"
        );
    }

    public void notifyScheduleChange(String userId, String senderId, String senderName,
                                     String oldShift, String newShift, String date) {
        createNotification(
                userId,
                senderId,
                senderName,
                "Schedule Change Alert ⏰",
                String.format("%s changed your schedule from '%s' to '%s' for %s.",
                        senderName, oldShift, newShift, date),
                "INFO",
                "SCHEDULE"
        );
    }

    public void notifyShiftAssigned(String userId, String senderId, String senderName,
                                    String shiftTime, String date) {
        createNotification(
                userId,
                senderId,
                senderName,
                "New Shift Assigned 📋",
                String.format("%s assigned you a shift at %s on %s.",
                        senderName, shiftTime, date),
                "INFO",
                "SCHEDULE"
        );
    }

    public void notifyShiftRemoved(String userId, String senderId, String senderName,
                                   String shiftTime, String date) {
        createNotification(
                userId,
                senderId,
                senderName,
                "Shift Removed ❌",
                String.format("%s removed your shift at %s on %s.",
                        senderName, shiftTime, date),
                "INFO",
                "SCHEDULE"
        );
    }

    public void notifyScheduleConflict(String userId, String senderId, String senderName,
                                       String date, String conflictDetails) {
        createNotification(
                userId,
                senderId,
                senderName,
                "Schedule Conflict Detected ⚠️",
                String.format("A schedule conflict was detected for %s: %s",
                        date, conflictDetails),
                "ERROR",
                "SCHEDULE"
        );
    }
    // ============================================
    // TASK NOTIFICATIONS
    // ============================================

    public void notifyTaskAssigned(String userId, String senderId, String senderName,
                                   String taskTitle, String projectName) {
        createNotification(
                userId,
                senderId,
                senderName,
                "New Task Assigned 📋",
                String.format("%s assigned you a new task: '%s' in project '%s'.",
                        senderName, taskTitle, projectName),
                "INFO",
                "TASK"
        );
    }

    public void notifyTaskSubmitted(String managerId, String senderId, String senderName,
                                    String taskTitle) {
        createNotification(
                managerId,
                senderId,
                senderName,
                "Task Submitted for Review 📤",
                String.format("%s has submitted task '%s' for review.",
                        senderName, taskTitle),
                "INFO",
                "TASK"
        );
    }

    public void notifyTaskApproved(String userId, String senderId, String senderName, String taskTitle) {
        createNotification(
                userId,
                senderId,
                senderName,
                "Task Approved 🎉",
                String.format("%s approved your task '%s'.",
                        senderName, taskTitle),
                "SUCCESS",
                "TASK"
        );
    }

    public void notifyTaskRejected(String userId, String senderId, String senderName,
                                   String taskTitle, String feedback) {
        createNotification(
                userId,
                senderId,
                senderName,
                "Task Rejected ❌",
                String.format("%s rejected your task '%s'. Feedback: %s",
                        senderName, taskTitle, feedback),
                "ERROR",
                "TASK"
        );
    }

    // ============================================
    // ANNOUNCEMENT NOTIFICATIONS (System Sender)
    // ============================================

    public void notifyNewAnnouncement(String userId, String title) {
        createNotification(
                userId,
                null,
                "System",
                "New Announcement 📢",
                String.format("A new announcement has been posted: '%s'", title),
                "INFO",
                "ANNOUNCEMENT"

        );
    }

    // ============================================
    // INVITATION NOTIFICATIONS
    // ============================================

    public void notifyInvitationReceived(String userId, String senderId, String senderName, String teamName) {
        createNotification(
                userId,
                senderId,
                senderName,
                "Team Invitation Received 📧",
                String.format("%s invited you to join team '%s'.",
                        senderName, teamName),
                "INFO",
                "INVITATION"
        );
    }

    // ============================================
    // SEND TO MULTIPLE USERS
    // ============================================

    public void notifyMultipleUsers(List<String> userIds, String senderId, String senderName,
                                    String title, String message, String type, String entityType) {
        for (String userId : userIds) {
            createNotification(userId, senderId, senderName, title, message, type, entityType);
        }
        log.info("📬 Sent notification to {} users", userIds.size());
    }
}