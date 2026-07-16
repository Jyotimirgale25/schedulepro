package com.schedulepro.employee.dto.response;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class DashboardResponseDTO {

    private StatsDTO stats;
    private List<ScheduleDTO> schedules;
    private List<TaskDTO> pendingTasks;
    private List<LeaveDTO> leaveRequests;
    private AnalyticsDTO analytics;

    @Data
    @Builder
    public static class StatsDTO {
        private Integer shiftsThisMonth;
        private Double leavesTaken;
        private Integer hoursWorked;
        private Integer attendanceRate;
    }

    @Data
    @Builder
    public static class ScheduleDTO {
        private String id;
        private String date;
        private String shift;
        private String status;
    }

    @Data
    @Builder
    public static class TaskDTO {
        private String id;
        private String taskName;
        private String project;
        private String dueDate;
        private String status;
        private Integer progress;
    }

    @Data
    @Builder
    public static class LeaveDTO {
        private String id;
        private String startDate;
        private String endDate;
        private String reason;
        private String status;
    }

    @Data
    @Builder
    public static class AnalyticsDTO {
        private Integer totalTasks;
        private Integer completedTasks;
        private Integer inProgressTasks;
        private Integer pendingCount;
        private Integer completionRate;
        private Integer onTimeRate;
        private Integer productivityScore;
    }
}