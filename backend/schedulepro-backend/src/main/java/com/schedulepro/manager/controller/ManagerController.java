// src/main/java/com/schedulepro/manager/controller/ManagerController.java
package com.schedulepro.manager.controller;

import com.schedulepro.manager.dto.request.LeaveApprovalRequest;
import com.schedulepro.manager.dto.request.InviteRequestDTO;
import com.schedulepro.manager.dto.request.ScheduleRequestDTO;
import com.schedulepro.manager.dto.response.LeaveRequestDTO;
import com.schedulepro.manager.dto.response.TeamMemberDTO;
import com.schedulepro.manager.dto.response.ManagerStatsDTO;
import com.schedulepro.manager.dto.response.ActivityDTO;
import com.schedulepro.employee.dto.response.InvitationDTO;
import com.schedulepro.employee.dto.response.ScheduleResponseDTO;
import com.schedulepro.employee.dto.response.SwapResponseDTO;
import com.schedulepro.manager.service.ManagerLeaveService;
import com.schedulepro.manager.service.ManagerTeamService;
import com.schedulepro.manager.service.ManagerDashboardService;
import com.schedulepro.manager.service.ManagerSwapService;
import com.schedulepro.manager.service.ManagerInvitationService;
import com.schedulepro.manager.service.ManagerScheduleService;
import com.schedulepro.auth.entity.User;
import com.schedulepro.auth.repository.UserRepository;
import com.schedulepro.employee.entity.Project;
import com.schedulepro.employee.repository.ProjectRepository;
import com.schedulepro.manager.service.ProjectService;
import com.schedulepro.employee.entity.Task;
import com.schedulepro.manager.service.TaskService;
import com.schedulepro.manager.dto.response.ProjectDTO;
import com.schedulepro.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import com.schedulepro.employee.service.NotificationHelper;
import com.schedulepro.employee.entity.Notification;
import com.schedulepro.employee.entity.NotificationType;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/manager")
@RequiredArgsConstructor
@PreAuthorize("hasRole('MANAGER') or hasRole('ADMIN')")
@Slf4j
public class ManagerController {

    private final ManagerLeaveService managerLeaveService;
    private final ManagerTeamService managerTeamService;
    private final ManagerDashboardService managerDashboardService;
    private final ManagerSwapService managerSwapService;
    private final ManagerInvitationService managerInvitationService;
    private final ManagerScheduleService managerScheduleService;
    private final ProjectService projectService;
    private final TaskService taskService;
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final NotificationHelper notificationHelper;
    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    // ===== LEAVE MANAGEMENT =====
    @GetMapping("/leaves/pending")
    public ResponseEntity<List<LeaveRequestDTO>> getPendingLeaves() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        List<LeaveRequestDTO> pendingLeaves = managerLeaveService.getPendingLeavesForManager(email);
        return ResponseEntity.ok(pendingLeaves);
    }

    @PutMapping("/leaves/{id}/approve")
    public ResponseEntity<LeaveRequestDTO> approveLeave(
            @PathVariable String id,
            @RequestBody LeaveApprovalRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        LeaveRequestDTO approvedLeave = managerLeaveService.approveLeave(id, email, request);
        return ResponseEntity.ok(approvedLeave);
    }

    @PutMapping("/leaves/{id}/reject")
    public ResponseEntity<LeaveRequestDTO> rejectLeave(
            @PathVariable String id,
            @RequestBody LeaveApprovalRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        LeaveRequestDTO rejectedLeave = managerLeaveService.rejectLeave(id, email, request);
        return ResponseEntity.ok(rejectedLeave);
    }

    // ===== TEAM MANAGEMENT =====
    @GetMapping("/team")
    public ResponseEntity<List<TeamMemberDTO>> getTeamMembers() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        List<TeamMemberDTO> team = managerTeamService.getTeamMembers(email);
        return ResponseEntity.ok(team);
    }

    @DeleteMapping("/team/{id}")
    public ResponseEntity<?> removeTeamMember(@PathVariable String id) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        managerTeamService.removeTeamMember(email, id);
        return ResponseEntity.ok().build();
    }

    // ===== INVITATIONS =====
    @PostMapping("/invitations")
    public ResponseEntity<InvitationDTO> sendInvitation(@RequestBody InviteRequestDTO request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        InvitationDTO invitation = managerInvitationService.sendInvitation(email, request);
        return ResponseEntity.ok(invitation);
    }

    @GetMapping("/invitations")
    public ResponseEntity<List<InvitationDTO>> getPendingInvitations() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        List<InvitationDTO> invitations = managerInvitationService.getPendingInvitations(email);
        return ResponseEntity.ok(invitations);
    }

    @DeleteMapping("/invitations/{id}")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<?> cancelInvitation(@PathVariable String id) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        managerInvitationService.cancelInvitation(id, email);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/invitations/rejected")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<List<InvitationDTO>> getRejectedInvitations() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        List<InvitationDTO> rejectedInvitations = managerInvitationService.getRejectedInvitations(email);
        return ResponseEntity.ok(rejectedInvitations);
    }

    // ===== DASHBOARD =====
    @GetMapping("/dashboard/stats")
    public ResponseEntity<ManagerStatsDTO> getDashboardStats() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        ManagerStatsDTO stats = managerDashboardService.getStats(email);
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/activities")
    public ResponseEntity<List<ActivityDTO>> getRecentActivities() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        List<ActivityDTO> activities = managerDashboardService.getRecentActivities(email);
        return ResponseEntity.ok(activities);
    }

    // ===== SCHEDULE MANAGEMENT =====
    @GetMapping("/schedules")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<List<ScheduleResponseDTO>> getTeamSchedules() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(managerScheduleService.getTeamSchedules(email));
    }

    @PostMapping("/schedules")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<ScheduleResponseDTO> createSchedule(@RequestBody ScheduleRequestDTO request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();

        // ✅ Create schedule
        ScheduleResponseDTO created = managerScheduleService.createSchedule(email, request);

        // ✅ ADD THIS - Send notification to employee
        if (notificationHelper != null && created != null && created.getEmployeeId() != null) {
            User manager = getCurrentUser();
            notificationHelper.createNotification(
                    created.getEmployeeId(),           // Employee ID
                    manager.getId(),                   // Sender ID (Manager)
                    manager.getFullName(),             // Sender Name
                    "📅 New Schedule Assigned",        // Title
                    "You have been scheduled for " + created.getShift() + " on " + created.getDate(),  // Message
                    "SCHEDULE",                        // Type
                    "SCHEDULE"                         // Entity Type
            );
        }

        return ResponseEntity.ok(created);
    }

    @DeleteMapping("/schedules/{id}")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<Void> deleteSchedule(@PathVariable String id) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        managerScheduleService.deleteSchedule(email, id);
        return ResponseEntity.ok().build();
    }

    // ===== SWAP MANAGEMENT =====
    @GetMapping("/swaps/pending")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<List<SwapResponseDTO>> getPendingSwaps() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(managerSwapService.getPendingSwaps(email));
    }

    @PutMapping("/swaps/{id}/approve")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<SwapResponseDTO> approveSwap(
            @PathVariable String id,
            @RequestBody Map<String, String> request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        String comments = request.getOrDefault("comments", "Approved by manager");
        return ResponseEntity.ok(managerSwapService.approveSwap(email, id, comments));
    }

    @PutMapping("/swaps/{id}/reject")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<SwapResponseDTO> rejectSwap(
            @PathVariable String id,
            @RequestBody Map<String, String> request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        String comments = request.getOrDefault("comments", "Rejected by manager");
        return ResponseEntity.ok(managerSwapService.rejectSwap(email, id, comments));
    }

    // ===== AUTH CHECK =====
    @GetMapping("/check-auth")
    public ResponseEntity<Map<String, Object>> checkAuth() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Map<String, Object> response = new HashMap<>();
        response.put("authenticated", auth != null);
        response.put("name", auth != null ? auth.getName() : null);
        response.put("authorities", auth != null ? auth.getAuthorities().toString() : null);
        return ResponseEntity.ok(response);
    }

    // ===== PROJECT MANAGEMENT =====
    @GetMapping("/projects")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<List<ProjectDTO>> getProjects() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(projectService.getProjectsForManagerDTO(email));
    }

    @PostMapping("/projects")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<Project> createProject(@RequestBody Map<String, Object> request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();

        Project project = new Project();
        project.setName((String) request.get("name"));
        project.setDescription((String) request.get("description"));
        project.setPriority((String) request.get("priority"));

        String startDateStr = (String) request.get("startDate");
        String endDateStr = (String) request.get("endDate");

        if (startDateStr != null && !startDateStr.isEmpty()) {
            project.setStartDate(LocalDateTime.parse(startDateStr + "T00:00:00"));
        }
        if (endDateStr != null && !endDateStr.isEmpty()) {
            project.setEndDate(LocalDateTime.parse(endDateStr + "T00:00:00"));
        }

        return ResponseEntity.status(201).body(projectService.createProject(email, project));
    }

    @GetMapping("/projects/{id}")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<Project> getProjectById(@PathVariable String id) {
        return ResponseEntity.ok(projectService.getProjectById(id));
    }

    @PutMapping("/projects/{id}")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<Project> updateProject(@PathVariable String id, @RequestBody Project project) {
        return ResponseEntity.ok(projectService.updateProject(id, project));
    }

    @DeleteMapping("/projects/{id}")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<Void> deleteProject(@PathVariable String id) {
        projectService.deleteProject(id);
        return ResponseEntity.ok().build();
    }

    // ===== TASK MANAGEMENT =====

    @GetMapping("/tasks")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<?> getTasks() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        try {
            log.info("🔍 Getting tasks for manager: {}", email);
            List<Task> tasks = taskService.getTasksForManager(email);
            log.info("✅ Found {} tasks for manager {}", tasks.size(), email);
            return ResponseEntity.ok(tasks);
        } catch (Exception e) {
            log.error("❌ Error getting tasks: {}", e.getMessage(), e);
            return ResponseEntity.ok(new ArrayList<>());
        }
    }

    @PostMapping("/tasks")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<?> createTask(@RequestBody Map<String, Object> request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        try {
            log.info("📤 Creating task for manager: {}", email);

            Task task = new Task();
            task.setTitle((String) request.get("title"));
            task.setDescription((String) request.get("description"));

            Map<String, String> projectMap = (Map<String, String>) request.get("project");
            if (projectMap != null && projectMap.containsKey("id")) {
                Project project = projectRepository.findById(projectMap.get("id"))
                        .orElseThrow(() -> new RuntimeException("Project not found"));
                task.setProject(project);
            }

            Map<String, String> assignedMap = (Map<String, String>) request.get("assignedTo");
            if (assignedMap != null && assignedMap.containsKey("id")) {
                User assignedUser = userRepository.findById(assignedMap.get("id"))
                        .orElseThrow(() -> new RuntimeException("User not found"));
                task.setAssignedTo(assignedUser);
            }

            task.setPriority((String) request.getOrDefault("priority", "MEDIUM"));
            task.setStatus("PENDING");
            task.setProgress(0);

            Task createdTask = taskService.createTask(email, task);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdTask);

        } catch (Exception e) {
            log.error("❌ Error creating task: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    // ✅ SINGLE getTasksForProject - with proper error handling
    @GetMapping("/projects/{projectId}/tasks")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<?> getTasksForProject(@PathVariable String projectId) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        try {
            log.info("📋 Getting tasks for project: {}", projectId);

            User manager = userRepository.findByEmail(email)
                    .orElseThrow(() -> new ResourceNotFoundException("Manager not found"));

            Project project = projectRepository.findById(projectId)
                    .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

            if (!project.getCreatedBy().equals(manager.getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "You don't have access to this project"));
            }

            List<Task> tasks = taskService.getTasksForProject(projectId);
            log.info("✅ Found {} tasks for project {}", tasks.size(), projectId);
            return ResponseEntity.ok(tasks);
        } catch (ResourceNotFoundException e) {
            log.error("❌ Project not found: {}", projectId);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("❌ Error getting tasks for project: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/tasks/{id}/approve")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<Task> approveTask(
            @PathVariable String id,
            @RequestBody(required = false) Map<String, String> request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        String comments = request != null ? request.getOrDefault("comments", "Approved by manager") : "Approved by manager";
        return ResponseEntity.ok(taskService.approveTask(email, id, comments));
    }

    @PutMapping("/tasks/{id}/reject")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<Task> rejectTask(
            @PathVariable String id,
            @RequestBody Map<String, String> request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        String reason = request.getOrDefault("reason", "Rejected by manager");
        return ResponseEntity.ok(taskService.rejectTask(email, id, reason));
    }


}