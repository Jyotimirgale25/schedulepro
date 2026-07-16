package com.schedulepro.employee.service;

import com.schedulepro.employee.dto.response.DashboardResponseDTO;
import com.schedulepro.auth.entity.User;
import com.schedulepro.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
public class EmployeeDashboardService {

    private final UserRepository userRepository;
    // TODO: Add repositories for Schedule, Task, Leave when created
    // private final ScheduleRepository scheduleRepository;
    // private final TaskRepository taskRepository;
    // private final LeaveRequestRepository leaveRepository;

    private static final DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    public DashboardResponseDTO getDashboard(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // For now, return sample data that matches your frontend structure
        // Once we create the actual repositories, we'll replace with real data

        return DashboardResponseDTO.builder()
                .stats(getStatsData(user))
                .schedules(getUpcomingSchedules())
                .pendingTasks(getPendingTasks())
                .leaveRequests(getPendingLeaves())
                .analytics(getAnalyticsData())
                .build();
    }

    private DashboardResponseDTO.StatsDTO getStatsData(User user) {
        // TODO: Replace with real data from database
        return DashboardResponseDTO.StatsDTO.builder()
                .shiftsThisMonth(8)
                .leavesTaken(2.5)
                .hoursWorked(160)
                .attendanceRate(96)
                .build();
    }

    private List<DashboardResponseDTO.ScheduleDTO> getUpcomingSchedules() {
        // TODO: Replace with real data from ScheduleRepository
        List<DashboardResponseDTO.ScheduleDTO> schedules = new ArrayList<>();

        schedules.add(DashboardResponseDTO.ScheduleDTO.builder()
                .id("sch-001")
                .date(LocalDate.now().plusDays(1).format(dateFormatter))
                .shift("9:00 AM - 5:00 PM")
                .status("Scheduled")
                .build());

        schedules.add(DashboardResponseDTO.ScheduleDTO.builder()
                .id("sch-002")
                .date(LocalDate.now().plusDays(2).format(dateFormatter))
                .shift("10:00 AM - 6:00 PM")
                .status("Scheduled")
                .build());

        schedules.add(DashboardResponseDTO.ScheduleDTO.builder()
                .id("sch-003")
                .date(LocalDate.now().plusDays(3).format(dateFormatter))
                .shift("9:00 AM - 5:00 PM")
                .status("Scheduled")
                .build());

        return schedules;
    }

    private List<DashboardResponseDTO.TaskDTO> getPendingTasks() {
        // TODO: Replace with real data from TaskRepository
        List<DashboardResponseDTO.TaskDTO> tasks = new ArrayList<>();

        tasks.add(DashboardResponseDTO.TaskDTO.builder()
                .id("task-001")
                .taskName("Complete Dashboard UI")
                .project("Schedule Pro")
                .dueDate(LocalDate.now().plusDays(2).format(dateFormatter))
                .status("IN_PROGRESS")
                .progress(65)
                .build());

        tasks.add(DashboardResponseDTO.TaskDTO.builder()
                .id("task-002")
                .taskName("Write API Documentation")
                .project("Backend API")
                .dueDate(LocalDate.now().plusDays(5).format(dateFormatter))
                .status("PENDING")
                .progress(0)
                .build());

        return tasks;
    }

    private List<DashboardResponseDTO.LeaveDTO> getPendingLeaves() {
        // TODO: Replace with real data from LeaveRepository
        List<DashboardResponseDTO.LeaveDTO> leaves = new ArrayList<>();

        leaves.add(DashboardResponseDTO.LeaveDTO.builder()
                .id("leave-001")
                .startDate(LocalDate.now().plusDays(10).format(dateFormatter))
                .endDate(LocalDate.now().plusDays(15).format(dateFormatter))
                .reason("Family vacation")
                .status("PENDING")
                .build());

        return leaves;
    }

    private DashboardResponseDTO.AnalyticsDTO getAnalyticsData() {
        // TODO: Replace with real data from TaskRepository calculations
        return DashboardResponseDTO.AnalyticsDTO.builder()
                .totalTasks(12)
                .completedTasks(7)
                .inProgressTasks(3)
                .pendingCount(2)
                .completionRate(58)
                .onTimeRate(85)
                .productivityScore(72)
                .build();
    }
}