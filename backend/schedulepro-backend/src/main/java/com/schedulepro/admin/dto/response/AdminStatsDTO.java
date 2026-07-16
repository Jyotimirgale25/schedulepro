// src/main/java/com/schedulepro/admin/dto/response/AdminStatsDTO.java
package com.schedulepro.admin.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminStatsDTO {
    private long totalUsers;
    private long activeUsers;
    private long inactiveUsers;
    private long totalAdmins;
    private long totalManagers;
    private long totalEmployees;
    private long totalDepartments;
    private long totalProjects;
    private long totalTasks;
    private long pendingTasks;
    private long pendingLeaves;
}