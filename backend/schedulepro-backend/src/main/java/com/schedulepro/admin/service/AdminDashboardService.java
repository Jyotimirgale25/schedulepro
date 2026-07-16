// src/main/java/com/schedulepro/admin/service/AdminDashboardService.java
package com.schedulepro.admin.service;

import com.schedulepro.admin.dto.response.AdminDashboardStatsDTO;
import com.schedulepro.auth.repository.UserRepository;
import com.schedulepro.employee.repository.LeaveRequestRepository;
import com.schedulepro.employee.repository.ProjectRepository;
import com.schedulepro.employee.repository.SwapRequestRepository;
import com.schedulepro.employee.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminDashboardService {

    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;
    private final LeaveRequestRepository leaveRequestRepository;
    private final SwapRequestRepository swapRequestRepository;

    public AdminDashboardStatsDTO getDashboardStats() {
        log.info("Fetching admin dashboard statistics");

        long totalUsers = userRepository.count();
        long activeUsers = userRepository.countByIsActive(true);
        long inactiveUsers = userRepository.countByIsActive(false);

        // ✅ Use String for role
        long totalAdmins = userRepository.countByRole("ADMIN");
        long totalManagers = userRepository.countByRole("MANAGER");
        long totalEmployees = userRepository.countByRole("EMPLOYEE");

        long totalProjects = projectRepository.count();
        long totalTasks = taskRepository.count();
        long pendingTasks = taskRepository.countByStatus("PENDING");

        long pendingLeaves = leaveRequestRepository.countByStatus("PENDING");

        // ✅ Use the correct method for swaps
        long pendingSwaps = swapRequestRepository.countByManagerStatus("PENDING");

        return AdminDashboardStatsDTO.builder()
                .totalUsers(totalUsers)
                .activeUsers(activeUsers)
                .inactiveUsers(inactiveUsers)
                .totalAdmins(totalAdmins)
                .totalManagers(totalManagers)
                .totalEmployees(totalEmployees)
                .totalProjects(totalProjects)
                .totalTasks(totalTasks)
                .pendingTasks(pendingTasks)
                .pendingLeaves(pendingLeaves)
                .pendingSwaps(pendingSwaps)
                .build();
    }
}