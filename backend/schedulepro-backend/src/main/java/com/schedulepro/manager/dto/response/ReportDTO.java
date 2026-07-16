// src/main/java/com/schedulepro/manager/dto/response/ReportDTO.java
package com.schedulepro.manager.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportDTO {
    private TaskStatsDTO taskStats;
    private LeaveStatsDTO leaveStats;
    private AttendanceStatsDTO attendanceStats;
    private List<EmployeeReportDTO> employees;
    private String reportPeriod;
    private String generatedAt;
    private String reportType;
    private int totalEmployees;
    private int activeEmployees;

    // ===== NESTED CLASSES =====

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TaskStatsDTO {
        private int completed;
        private int total;
        private int inProgress;
        private int pending;
        private int rejected;
        private int submitted;
        private double completionRate;
        private String completionStatus;

        public String getCompletionStatus() {
            if (completionRate >= 90) return "EXCELLENT";
            if (completionRate >= 75) return "GOOD";
            if (completionRate >= 60) return "AVERAGE";
            if (completionRate >= 40) return "NEEDS_IMPROVEMENT";
            return "POOR";
        }
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LeaveStatsDTO {
        private int totalTaken;
        private int pending;
        private int approved;
        private int rejected;
        private int annualLeaves;
        private int sickLeaves;
        private int emergencyLeaves;
        private int casualLeaves;
        private double leaveBalance;
        private String period;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AttendanceStatsDTO {
        private double average;
        private int presentDays;
        private int totalDays;
        private int lateArrivals;
        private int earlyDepartures;
        private int absents;
        private String attendanceStatus;

        public String getAttendanceStatus() {
            if (average >= 95) return "EXCELLENT";
            if (average >= 85) return "GOOD";
            if (average >= 75) return "AVERAGE";
            return "POOR";
        }
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EmployeeReportDTO {
        private String employeeId;
        private String employeeName;
        private String email;
        private String department;
        private String position;
        private String profilePhoto;
        private TaskStatsDTO tasks;
        private LeaveStatsDTO leaves;
        private AttendanceStatsDTO attendance;
        private String performance;
        private double performanceScore;
    }
}