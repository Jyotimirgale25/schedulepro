// src/main/java/com/schedulepro/admin/dto/response/ProjectResponseDTO.java
package com.schedulepro.admin.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ProjectResponseDTO {
    private String id;
    private String name;
    private String description;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private String priority;
    private String status;
    private Integer progress;
    private String createdBy;
    private String createdByName;
    private String managerId;
    private String managerName;
    private Long taskCount;
    private Long completedCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}