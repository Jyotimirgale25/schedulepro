// src/main/java/com/schedulepro/admin/dto/request/BroadcastNotificationRequest.java
package com.schedulepro.admin.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class BroadcastNotificationRequest {
    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Message is required")
    private String message;

    private String type; // SYSTEM, ANNOUNCEMENT, GENERAL
    private String targetRole; // ALL, EMPLOYEE, MANAGER, ADMIN
    private String link;
    private String entityType;
    private String entityId;
}