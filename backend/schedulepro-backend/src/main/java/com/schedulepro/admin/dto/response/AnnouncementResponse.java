package com.schedulepro.admin.dto.response;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class AnnouncementResponse {
    private String id;
    private String title;
    private String content;
    private String type;
    private String createdBy;
    private String createdByName;
    private Boolean isActive;
    private LocalDateTime validFrom;
    private LocalDateTime validTo;
    private LocalDateTime createdAt;
}