// src/main/java/com/schedulepro/employee/dto/response/NotificationDTO.java
package com.schedulepro.employee.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDTO {
    private String id;
    private String title;
    private String message;
    private String type;
    private Boolean isRead;
    private LocalDateTime readAt;
    private String link;
    private String entityType;
    private String entityId;
    private String senderId;
    private String senderName;
    private LocalDateTime createdAt;
    private String timeAgo;
}