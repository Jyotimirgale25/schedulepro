// src/main/java/com/schedulepro/admin/dto/response/AdminNotificationDTO.java
package com.schedulepro.admin.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class AdminNotificationDTO {
    private String id;
    private String userId;
    private String userFullName;
    private String userEmail;
    private String senderName;
    private String title;
    private String message;
    private String type;
    private Boolean isRead;
    private LocalDateTime readAt;
    private String link;
    private String entityType;
    private String entityId;
    private LocalDateTime createdAt;
    private String timeAgo;
}