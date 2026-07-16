// src/main/java/com/schedulepro/admin/dto/response/TaskStatsDTO.java
package com.schedulepro.admin.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TaskStatsDTO {
    private long totalTasks;
    private long pendingTasks;
    private long inProgressTasks;
    private long submittedTasks;
    private long approvedTasks;
    private long rejectedTasks;
    private long completionRate;
}