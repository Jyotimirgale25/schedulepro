package com.schedulepro.manager.dto.request;

import lombok.Data;

@Data
public class TaskCreateRequest {
    private String title;
    private String description;
    private String assignedToId;
    private String projectId;
    private String dueDate;
    private String priority;
}