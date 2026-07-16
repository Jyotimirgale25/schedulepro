// src/main/java/com/schedulepro/employee/dto/request/MarkNotificationRequest.java
package com.schedulepro.employee.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MarkNotificationRequest {
    private String notificationId;
}