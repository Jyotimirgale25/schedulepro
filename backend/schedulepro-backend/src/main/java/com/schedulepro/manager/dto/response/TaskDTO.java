package com.schedulepro.manager.dto.response;

import lombok.Builder;
import lombok.Data;
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
    private LocalDateTime dueDate;
    private LocalDateTime createdAt;
}