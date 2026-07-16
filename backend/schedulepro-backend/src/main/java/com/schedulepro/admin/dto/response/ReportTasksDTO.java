// src/main/java/com/schedulepro/admin/dto/response/ReportTasksDTO.java
package com.schedulepro.admin.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ReportTasksDTO {
    private TaskStatusCounts byStatus;
    private TaskPriorityCounts byPriority;
    private long completionRate;

    @Data
    @Builder
    public static class TaskStatusCounts {
        private long pending;
        private long inProgress;
        private long submitted;
        private long approved;
        private long rejected;
    }

    @Data
    @Builder
    public static class TaskPriorityCounts {
        private long high;
        private long medium;
        private long low;
    }
}