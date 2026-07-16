// src/main/java/com/schedulepro/admin/dto/response/TaskResponseDTO.java
package com.schedulepro.admin.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class TaskResponseDTO {
    private String id;
    private String title;
    private String description;
    private String projectId;
    private String projectName;
    private String assignedTo;
    private String assignedToName;
    private String assignedToEmail;
    private String assignedBy;
    private String assignedByName;
    private String priority;
    private LocalDateTime dueDate;
    private String status;
    private Integer progress;
    private String createdBy;
    private String createdByName;
    private String approvedBy;
    private String approvedByName;
    private LocalDateTime approvedAt;
    private LocalDateTime submittedAt;
    private LocalDateTime completedAt;
    private String rejectionReason;
    private String rejectionNote;
    private String resubmissionNote;
    private String feedback;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}