// src/main/java/com/schedulepro/admin/dto/response/AnnouncementResponseDTO.java

package com.schedulepro.admin.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnnouncementResponseDTO {

    private String id;
    private String title;
    private String content;
    private String type;      // ✅ ADD THIS
    private String priority;
    private Boolean isActive;
    private String createdBy;
    private String createdByName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime expiresAt;
    private Boolean isRead;
}