// src/main/java/com/schedulepro/admin/dto/response/AdminDashboardStatsDTO.java
package com.schedulepro.admin.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AdminDashboardStatsDTO {
    private long totalUsers;
    private long activeUsers;
    private long inactiveUsers;
    private long totalAdmins;
    private long totalManagers;
    private long totalEmployees;
    private long totalProjects;
    private long totalTasks;
    private long pendingTasks;
    private long pendingLeaves;
    private long pendingSwaps;
}