// src/main/java/com/schedulepro/employee/dto/request/CreateNotificationRequest.java
package com.schedulepro.employee.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateNotificationRequest {
    private String userId;
    private String senderId;
    private String senderName;
    private String title;
    private String message;
    private String type;
    private String link;
    private String entityType;
    private String entityId;
}