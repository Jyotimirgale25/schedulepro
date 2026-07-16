package com.schedulepro.manager.service;

import com.schedulepro.auth.entity.User;
import com.schedulepro.auth.repository.UserRepository;
import com.schedulepro.employee.entity.LeaveRequest;
import com.schedulepro.employee.repository.LeaveRequestRepository;
import com.schedulepro.manager.dto.response.ActivityDTO;
import com.schedulepro.manager.dto.response.ManagerStatsDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ManagerDashboardService {

    private final UserRepository userRepository;
    private final LeaveRequestRepository leaveRequestRepository;

    public ManagerStatsDTO getStats(String managerEmail) {
        User manager = userRepository.findByEmail(managerEmail)
                .orElseThrow(() -> new RuntimeException("Manager not found"));

        List<User> teamMembers = userRepository.findByManagerId(manager.getId());
        List<String> teamMemberIds = teamMembers.stream()
                .map(User::getId)
                .collect(Collectors.toList());

        // Get pending leaves count
        List<LeaveRequest> pendingLeaves = leaveRequestRepository
                .findByUserIdInAndStatus(teamMemberIds, "PENDING");

        return ManagerStatsDTO.builder()
                .teamMembers(teamMembers.size())
                .pendingLeaves(pendingLeaves.size())
                .pendingSwaps(0)  // TODO: Implement swap count
                .activeProjects(4) // TODO: Implement project count
                .completedTasks(0) // TODO: Implement task count
                .attendanceRate(96.5)
                .build();
    }

    public List<ActivityDTO> getRecentActivities(String managerEmail) {
        User manager = userRepository.findByEmail(managerEmail)
                .orElseThrow(() -> new RuntimeException("Manager not found"));

        List<User> teamMembers = userRepository.findByManagerId(manager.getId());
        List<String> teamMemberIds = teamMembers.stream()
                .map(User::getId)
                .collect(Collectors.toList());

        List<ActivityDTO> activities = new ArrayList<>();

        // Get pending leave activities
        List<LeaveRequest> pendingLeaves = leaveRequestRepository
                .findByUserIdInAndStatus(teamMemberIds, "PENDING");

        for (LeaveRequest leave : pendingLeaves) {
            activities.add(ActivityDTO.builder()
                    .id("leave-" + leave.getId())
                    .type("leave")
                    .title("Leave Request")
                    .action(leave.getUser().getFullName() + " requested " + leave.getLeaveType() + " leave")
                    .details(leave.getStartDate() + " to " + leave.getEndDate())
                    .status("PENDING")
                    .icon("📋")
                    .date(leave.getCreatedAt())
                    .employeeName(leave.getUser().getFullName())
                    .employeeEmail(leave.getUser().getEmail())
                    .build());
        }

        // Sort by date (most recent first)
        activities.sort((a, b) -> b.getDate().compareTo(a.getDate()));

        return activities.stream().limit(10).collect(Collectors.toList());
    }
}