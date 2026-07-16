// src/main/java/com/schedulepro/admin/service/AdminReportService.java
package com.schedulepro.admin.service;

import com.schedulepro.admin.dto.response.ReportOverviewDTO;
import com.schedulepro.admin.dto.response.ReportResponseDTO;
import com.schedulepro.admin.dto.response.ReportTasksDTO;
import com.schedulepro.admin.dto.response.ReportUserDTO;
import com.schedulepro.auth.entity.User;
import com.schedulepro.auth.repository.UserRepository;
import com.schedulepro.employee.entity.LeaveRequest;
import com.schedulepro.employee.entity.Project;
import com.schedulepro.employee.entity.Task;
import com.schedulepro.employee.repository.LeaveRequestRepository;
import com.schedulepro.employee.repository.ProjectRepository;
import com.schedulepro.employee.repository.TaskRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminReportService {

    private final UserRepository userRepository;
    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final LeaveRequestRepository leaveRequestRepository;
    private final ObjectMapper objectMapper;

    public ReportResponseDTO generateReport(LocalDate startDate, LocalDate endDate) {
        log.info("Generating report from {} to {}", startDate, endDate);

        List<User> allUsers = userRepository.findAll();
        List<Task> allTasks = taskRepository.findAll();
        List<Project> allProjects = projectRepository.findAll();
        List<LeaveRequest> allLeaves = leaveRequestRepository.findAll();

        List<Task> filteredTasks = filterTasksByDate(allTasks, startDate, endDate);
        List<LeaveRequest> filteredLeaves = filterLeavesByDate(allLeaves, startDate, endDate);

        return ReportResponseDTO.builder()
                .overview(buildOverview(allUsers, allProjects, filteredTasks, filteredLeaves, startDate, endDate))
                .tasks(buildTasksReport(filteredTasks))
                .users(buildUsersReport(allUsers, filteredTasks, filteredLeaves))
                .build();
    }

    public String exportReportAsJson(LocalDate startDate, LocalDate endDate) throws JsonProcessingException {
        ReportResponseDTO report = generateReport(startDate, endDate);
        return objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(report);
    }

    public String exportReportAsCsv(LocalDate startDate, LocalDate endDate) {
        ReportResponseDTO report = generateReport(startDate, endDate);

        StringBuilder csv = new StringBuilder();

        csv.append("=== SYSTEM OVERVIEW ===\n");
        csv.append("Metric,Value\n");
        csv.append("Total Users,").append(report.getOverview().getTotalUsers()).append("\n");
        csv.append("Total Managers,").append(report.getOverview().getTotalManagers()).append("\n");
        csv.append("Total Employees,").append(report.getOverview().getTotalEmployees()).append("\n");
        csv.append("Total Projects,").append(report.getOverview().getTotalProjects()).append("\n");
        csv.append("Total Tasks,").append(report.getOverview().getTotalTasks()).append("\n");
        csv.append("Completed Tasks,").append(report.getOverview().getCompletedTasks()).append("\n");
        csv.append("Pending Leaves,").append(report.getOverview().getPendingLeaves()).append("\n");
        csv.append("Date Range,").append(report.getOverview().getDateRange()).append("\n\n");

        csv.append("=== TASK STATUS ===\n");
        csv.append("Status,Count\n");
        csv.append("Pending,").append(report.getTasks().getByStatus().getPending()).append("\n");
        csv.append("In Progress,").append(report.getTasks().getByStatus().getInProgress()).append("\n");
        csv.append("Submitted,").append(report.getTasks().getByStatus().getSubmitted()).append("\n");
        csv.append("Approved,").append(report.getTasks().getByStatus().getApproved()).append("\n");
        csv.append("Rejected,").append(report.getTasks().getByStatus().getRejected()).append("\n\n");

        csv.append("=== TASK PRIORITY ===\n");
        csv.append("Priority,Count\n");
        csv.append("High,").append(report.getTasks().getByPriority().getHigh()).append("\n");
        csv.append("Medium,").append(report.getTasks().getByPriority().getMedium()).append("\n");
        csv.append("Low,").append(report.getTasks().getByPriority().getLow()).append("\n\n");

        csv.append("Completion Rate,").append(report.getTasks().getCompletionRate()).append("%\n\n");

        csv.append("=== USER PERFORMANCE ===\n");
        csv.append("Name,Email,Role,Tasks Assigned,Tasks Completed,Leaves Taken,Performance\n");
        for (ReportUserDTO user : report.getUsers()) {
            csv.append(user.getName()).append(",")
                    .append(user.getEmail()).append(",")
                    .append(user.getRole()).append(",")
                    .append(user.getTasksAssigned()).append(",")
                    .append(user.getTasksCompleted()).append(",")
                    .append(user.getLeavesTaken()).append(",")
                    .append(user.getPerformance()).append("%\n");
        }

        return csv.toString();
    }

    private ReportOverviewDTO buildOverview(List<User> users, List<Project> projects,
                                            List<Task> tasks, List<LeaveRequest> leaves,
                                            LocalDate startDate, LocalDate endDate) {
        long totalManagers = users.stream()
                .filter(u -> u.getRole() != null && "MANAGER".equals(u.getRole()))
                .count();
        long totalEmployees = users.stream()
                .filter(u -> u.getRole() != null && "EMPLOYEE".equals(u.getRole()))
                .count();
        long completedTasks = tasks.stream()
                .filter(t -> "APPROVED".equals(t.getStatus()) || "COMPLETED".equals(t.getStatus()))
                .count();
        long pendingLeaves = leaves.stream()
                .filter(l -> "PENDING".equals(l.getStatus()))
                .count();

        String dateRange = "All time";
        if (startDate != null && endDate != null) {
            dateRange = startDate + " to " + endDate;
        } else if (startDate != null) {
            dateRange = "From " + startDate;
        } else if (endDate != null) {
            dateRange = "Until " + endDate;
        }

        return ReportOverviewDTO.builder()
                .totalUsers(users.size())
                .totalManagers(totalManagers)
                .totalEmployees(totalEmployees)
                .totalProjects(projects.size())
                .totalTasks(tasks.size())
                .completedTasks(completedTasks)
                .pendingLeaves(pendingLeaves)
                .dateRange(dateRange)
                .build();
    }

    private ReportTasksDTO buildTasksReport(List<Task> tasks) {
        long pending = tasks.stream().filter(t -> "PENDING".equals(t.getStatus())).count();
        long inProgress = tasks.stream().filter(t -> "IN_PROGRESS".equals(t.getStatus())).count();
        long submitted = tasks.stream().filter(t -> "SUBMITTED".equals(t.getStatus())).count();
        long approved = tasks.stream().filter(t -> "APPROVED".equals(t.getStatus()) || "COMPLETED".equals(t.getStatus())).count();
        long rejected = tasks.stream().filter(t -> "REJECTED".equals(t.getStatus())).count();

        long high = tasks.stream().filter(t -> "HIGH".equals(t.getPriority())).count();
        long medium = tasks.stream().filter(t -> "MEDIUM".equals(t.getPriority())).count();
        long low = tasks.stream().filter(t -> "LOW".equals(t.getPriority())).count();

        long completionRate = tasks.size() > 0 ? (approved * 100 / tasks.size()) : 0;

        return ReportTasksDTO.builder()
                .byStatus(ReportTasksDTO.TaskStatusCounts.builder()
                        .pending(pending)
                        .inProgress(inProgress)
                        .submitted(submitted)
                        .approved(approved)
                        .rejected(rejected)
                        .build())
                .byPriority(ReportTasksDTO.TaskPriorityCounts.builder()
                        .high(high)
                        .medium(medium)
                        .low(low)
                        .build())
                .completionRate(completionRate)
                .build();
    }

    private List<ReportUserDTO> buildUsersReport(List<User> users, List<Task> tasks, List<LeaveRequest> leaves) {
        return users.stream()
                .map(user -> {
                    long tasksAssigned = tasks.stream()
                            .filter(t -> t.getAssignedTo() != null &&
                                    t.getAssignedTo().getId().equals(user.getId()))
                            .count();
                    long tasksCompleted = tasks.stream()
                            .filter(t -> t.getAssignedTo() != null &&
                                    t.getAssignedTo().getId().equals(user.getId()) &&
                                    ("APPROVED".equals(t.getStatus()) || "COMPLETED".equals(t.getStatus())))
                            .count();
                    long leavesTaken = leaves.stream()
                            .filter(l -> l.getUser() != null &&
                                    l.getUser().getId().equals(user.getId()) &&
                                    "APPROVED".equals(l.getStatus()))
                            .count();

                    double performance = tasksAssigned > 0 ?
                            (double) tasksCompleted / tasksAssigned * 100 : 0;

                    String roleName = user.getRole() != null ? user.getRole() : "UNKNOWN";

                    return ReportUserDTO.builder()
                            .id(user.getId().toString())
                            .name(user.getFullName())
                            .email(user.getEmail())
                            .role(roleName)
                            .tasksAssigned(tasksAssigned)
                            .tasksCompleted(tasksCompleted)
                            .leavesTaken(leavesTaken)
                            .performance(Math.round(performance * 100.0) / 100.0)
                            .build();
                })
                .collect(Collectors.toList());
    }

    private List<Task> filterTasksByDate(List<Task> tasks, LocalDate startDate, LocalDate endDate) {
        if (startDate == null && endDate == null) {
            return tasks;
        }

        return tasks.stream()
                .filter(task -> {
                    LocalDateTime createdAt = task.getCreatedAt();
                    if (createdAt == null) return false;

                    LocalDate taskDate = createdAt.toLocalDate();

                    if (startDate != null && endDate != null) {
                        return !taskDate.isBefore(startDate) && !taskDate.isAfter(endDate);
                    } else if (startDate != null) {
                        return !taskDate.isBefore(startDate);
                    } else if (endDate != null) {
                        return !taskDate.isAfter(endDate);
                    }
                    return true;
                })
                .collect(Collectors.toList());
    }

    private List<LeaveRequest> filterLeavesByDate(List<LeaveRequest> leaves, LocalDate startDate, LocalDate endDate) {
        if (startDate == null && endDate == null) {
            return leaves;
        }

        return leaves.stream()
                .filter(leave -> {
                    LocalDateTime createdAt = leave.getCreatedAt();
                    if (createdAt == null) return false;

                    LocalDate leaveDate = createdAt.toLocalDate();

                    if (startDate != null && endDate != null) {
                        return !leaveDate.isBefore(startDate) && !leaveDate.isAfter(endDate);
                    } else if (startDate != null) {
                        return !leaveDate.isBefore(startDate);
                    } else if (endDate != null) {
                        return !leaveDate.isAfter(endDate);
                    }
                    return true;
                })
                .collect(Collectors.toList());
    }
}