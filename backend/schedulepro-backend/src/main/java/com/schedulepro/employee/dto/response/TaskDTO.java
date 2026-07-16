package com.schedulepro.employee.dto.response;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class TaskDTO {
    private String id;
    private String title;
    private String description;
    private String projectId;
    private String projectName;
    private String assignedToId;
    private String assignedToName;
    private String assignedToEmail;
    private String status;
    private String priority;
    private Integer progress;
    private LocalDate startDate;
    private LocalDate dueDate;
    private LocalDateTime completedAt;
    private LocalDateTime submittedAt;     // ✅ ADD THIS
    private String rejectionReason;        // ✅ ADD THIS
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}