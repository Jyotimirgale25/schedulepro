// src/main/java/com/schedulepro/admin/dto/response/NotificationStatsDTO.java
package com.schedulepro.admin.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class NotificationStatsDTO {
    private long totalNotifications;
    private long unreadNotifications;
    private long readNotifications;
}