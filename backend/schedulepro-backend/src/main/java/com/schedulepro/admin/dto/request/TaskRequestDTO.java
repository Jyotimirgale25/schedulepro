// src/main/java/com/schedulepro/admin/dto/request/TaskRequestDTO.java
package com.schedulepro.admin.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class TaskRequestDTO {
    @NotBlank(message = "Task title is required")
    private String title;

    private String description;

    @NotNull(message = "Project ID is required")
    private String projectId;

    @NotNull(message = "Assigned to is required")
    private String assignedTo;

    private String priority = "MEDIUM";
    private LocalDateTime dueDate;
    private String status = "PENDING";
    private Integer progress = 0;
}