// src/main/java/com/schedulepro/admin/service/AdminNotificationHelper.java
package com.schedulepro.admin.service;

import com.schedulepro.employee.service.NotificationHelper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class AdminNotificationHelper {

    private final NotificationHelper notificationHelper;

    // ============================================
    // USER MANAGEMENT NOTIFICATIONS
    // ============================================

    public void notifyUserCreated(String userId, String adminId, String adminName) {
        notificationHelper.createNotification(
                userId,
                adminId,
                adminName,
                "Welcome to Schedule Pro 🎉",
                String.format("%s has created your account. Welcome aboard!", adminName),
                "SUCCESS",
                "USER"
        );
        log.info("📬 Welcome notification sent to new user by admin: {}", adminName);
    }

    public void notifyUserUpdated(String userId, String adminId, String adminName, String updatedFields) {
        notificationHelper.createNotification(
                userId,
                adminId,
                adminName,
                "Profile Updated 📝",
                String.format("%s has updated your profile information. Fields: %s", adminName, updatedFields),
                "INFO",
                "USER"
        );
        log.info("📬 Profile update notification sent to user by admin: {}", adminName);
    }

    public void notifyRoleChanged(String userId, String adminId, String adminName,
                                  String oldRole, String newRole) {
        notificationHelper.createNotification(
                userId,
                adminId,
                adminName,
                "Role Changed 🔄",
                String.format("%s has changed your role from %s to %s.",
                        adminName, oldRole, newRole),
                "INFO",
                "USER"
        );
        log.info("📬 Role change notification sent to user by admin: {}", adminName);
    }

    public void notifyUserDeactivated(String userId, String adminId, String adminName) {
        notificationHelper.createNotification(
                userId,
                adminId,
                adminName,
                "Account Deactivated ⛔",
                String.format("%s has deactivated your account. Please contact support.", adminName),
                "WARNING",
                "USER"
        );
        log.info("📬 Account deactivation notification sent to user by admin: {}", adminName);
    }

    public void notifyUserReactivated(String userId, String adminId, String adminName) {
        notificationHelper.createNotification(
                userId,
                adminId,
                adminName,
                "Account Reactivated ✅",
                String.format("%s has reactivated your account. You can now login.", adminName),
                "SUCCESS",
                "USER"
        );
        log.info("📬 Account reactivation notification sent to user by admin: {}", adminName);
    }

    public void notifyUserDeleted(String userId, String adminId, String adminName) {
        log.info("📬 User {} has been deleted by admin: {}", userId, adminName);
    }

    // ============================================
    // BULK NOTIFICATIONS
    // ============================================

    public void notifyAllUsers(List<String> userIds, String adminId,
                               String adminName, String title, String message) {
        notificationHelper.notifyMultipleUsers(
                userIds,
                adminId,
                adminName,
                title,
                message,
                "INFO",
                "BULK"
        );
        log.info("📬 Bulk notification sent to {} users by admin: {}", userIds.size(), adminName);
    }

    public void notifySystemMaintenance(List<String> userIds, String adminName,
                                        String maintenanceTime, String duration) {
        notificationHelper.notifyMultipleUsers(
                userIds,
                null,
                "System",
                "System Maintenance 🛠️",
                String.format("System maintenance at %s for %s. Please save your work.",
                        maintenanceTime, duration),
                "WARNING",
                "SYSTEM"
        );
        log.info("📬 System maintenance notification sent to {} users by admin: {}", userIds.size(), adminName);
    }

    public void notifyAdminAnnouncement(List<String> userIds, String adminId,
                                        String adminName, String announcementTitle) {
        notificationHelper.notifyMultipleUsers(
                userIds,
                adminId,
                adminName,
                "Admin Announcement 📢",
                String.format("Admin %s posted: '%s'", adminName, announcementTitle),
                "INFO",
                "ANNOUNCEMENT"
        );
        log.info("📬 Admin announcement sent to {} users by admin: {}", userIds.size(), adminName);
    }

    // ============================================
    // DEPARTMENT NOTIFICATIONS
    // ============================================

    public void notifyDepartmentUpdated(List<String> userIds, String adminId,
                                        String adminName, String departmentName) {
        notificationHelper.notifyMultipleUsers(
                userIds,
                adminId,
                adminName,
                "Department Updated 🏢",
                String.format("Department '%s' has been updated by admin %s.",
                        departmentName, adminName),
                "INFO",
                "DEPARTMENT"
        );
        log.info("📬 Department update notification sent to {} users", userIds.size());
    }

    public void notifyDepartmentDeleted(List<String> userIds, String adminId,
                                        String adminName, String departmentName) {
        notificationHelper.notifyMultipleUsers(
                userIds,
                adminId,
                adminName,
                "Department Deleted 🗑️",
                String.format("Department '%s' has been deleted by admin %s.",
                        departmentName, adminName),
                "WARNING",
                "DEPARTMENT"
        );
        log.info("📬 Department deletion notification sent to {} users", userIds.size());
    }

    // ============================================
    // SYSTEM SETTINGS NOTIFICATIONS
    // ============================================

    public void notifySystemSettingsUpdated(List<String> userIds, String adminName, String settingName) {
        notificationHelper.notifyMultipleUsers(
                userIds,
                null,
                "System",
                "System Settings Updated ⚙️",
                String.format("Admin %s has updated system settings: %s", adminName, settingName),
                "INFO",
                "SYSTEM"
        );
        log.info("📬 System settings update notification sent to {} users", userIds.size());
    }
}