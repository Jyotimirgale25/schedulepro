package com.schedulepro.manager.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class ManagerStatsDTO {
    private Integer teamMembers;
    private Integer pendingLeaves;
    private Integer pendingSwaps;
    private Integer activeProjects;
    private Integer completedTasks;
    private Double attendanceRate;
    private Integer teamSize;
    private Integer employeeCount;
    private Boolean departmentHead;
    private List<String> managedDepartments;
}