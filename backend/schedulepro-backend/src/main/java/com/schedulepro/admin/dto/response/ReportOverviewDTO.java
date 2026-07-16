// src/main/java/com/schedulepro/admin/dto/response/ReportOverviewDTO.java
package com.schedulepro.admin.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ReportOverviewDTO {
    private long totalUsers;
    private long totalManagers;
    private long totalEmployees;
    private long totalProjects;
    private long totalTasks;
    private long completedTasks;
    private long pendingLeaves;
    private String dateRange;
}