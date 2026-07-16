// src/main/java/com/schedulepro/admin/dto/response/ProjectStatsDTO.java
package com.schedulepro.admin.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ProjectStatsDTO {
    private long totalProjects;
    private long plannedProjects;
    private long inProgressProjects;
    private long completedProjects;
    private long onHoldProjects;
    private long cancelledProjects;
    private long totalTasks;
    private long completedTasks;
}