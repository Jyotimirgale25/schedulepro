// src/main/java/com/schedulepro/employee/controller/EmployeeController.java
package com.schedulepro.employee.controller;

import com.schedulepro.employee.dto.request.LeaveRequestDTO;
import com.schedulepro.employee.dto.request.SwapRequestDTO;
import com.schedulepro.employee.dto.response.DashboardResponseDTO;
import com.schedulepro.employee.dto.response.LeaveBalanceResponseDTO;
import com.schedulepro.employee.dto.response.LeaveResponseDTO;
import com.schedulepro.employee.dto.response.ScheduleResponseDTO;
import com.schedulepro.employee.dto.response.SwapResponseDTO;
import com.schedulepro.employee.entity.Task;
import com.schedulepro.employee.repository.InvitationRepository;
import com.schedulepro.employee.repository.TaskRepository;
import com.schedulepro.employee.service.EmployeeProjectService;
import com.schedulepro.employee.service.EmployeeTaskService;
import com.schedulepro.manager.dto.response.ProjectDTO;
import com.schedulepro.manager.dto.response.TeamMemberDTO;
import com.schedulepro.employee.service.EmployeeDashboardService;
import com.schedulepro.employee.service.EmployeeLeaveService;
import com.schedulepro.employee.service.EmployeeInvitationService;
import com.schedulepro.employee.service.EmployeeScheduleService;
import com.schedulepro.employee.service.EmployeeSwapService;
import com.schedulepro.manager.service.ManagerTeamService;
import com.schedulepro.manager.service.TaskService;
import com.schedulepro.auth.entity.User;
import com.schedulepro.auth.repository.UserRepository;
import com.schedulepro.employee.service.NotificationService;  // ✅ ADD THIS IMPORT
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import com.schedulepro.employee.dto.response.InvitationDTO;
import com.schedulepro.employee.dto.request.ProfileUpdateRequest;
import com.schedulepro.employee.dto.response.ProfileResponseDTO;
import com.schedulepro.employee.dto.response.PhotoHistoryDTO;
import com.schedulepro.employee.dto.request.ChangePasswordRequest;
import com.schedulepro.employee.service.ProfileService;
import jakarta.validation.Valid;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/employee")
@RequiredArgsConstructor
@PreAuthorize("hasRole('EMPLOYEE') or hasRole('MANAGER') or hasRole('ADMIN')")
@Slf4j
public class EmployeeController {

    private final EmployeeDashboardService dashboardService;
    private final EmployeeLeaveService leaveService;
    private final EmployeeInvitationService employeeInvitationService;
    private final EmployeeScheduleService employeeScheduleService;
    private final EmployeeSwapService employeeSwapService;
    private final UserRepository userRepository;
    private final ManagerTeamService managerTeamService;
    private final TaskRepository taskRepository;
    private final TaskService taskService;
    private final EmployeeProjectService employeeProjectService;
    private final EmployeeTaskService employeeTaskService;
    private final InvitationRepository invitationRepository;
    private final ProfileService profileService;
    private final NotificationService notificationService;  // ✅ MOVED INSIDE CLASS

    // ===== DASHBOARD =====
    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboard() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        DashboardResponseDTO dashboard = dashboardService.getDashboard(email);

        Map<String, Object> response = new HashMap<>();
        response.put("status", "success");
        response.put("data", dashboard);

        return ResponseEntity.ok(response);
    }

    // ===== LEAVE MANAGEMENT =====
    @GetMapping("/leaves")
    public ResponseEntity<List<LeaveResponseDTO>> getUserLeaves() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        List<LeaveResponseDTO> leaves = leaveService.getUserLeaves(email);
        return ResponseEntity.ok(leaves);
    }

    @GetMapping("/leaves/balance")
    public ResponseEntity<LeaveBalanceResponseDTO> getLeaveBalance() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        LeaveBalanceResponseDTO balance = leaveService.getLeaveBalance(email);
        return ResponseEntity.ok(balance);
    }

    @PostMapping("/leaves")
    public ResponseEntity<LeaveResponseDTO> createLeave(@RequestBody LeaveRequestDTO request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        LeaveResponseDTO response = leaveService.createLeaveRequest(email, request);
        return ResponseEntity.status(201).body(response);
    }

    // ===== INVITATION ENDPOINTS =====
    @GetMapping("/invitations")
    public ResponseEntity<?> getMyInvitations() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        var invitations = employeeInvitationService.getMyInvitations(email);
        return ResponseEntity.ok(invitations);
    }

    @PutMapping("/invitations/{id}/accept")
    public ResponseEntity<?> acceptInvitation(
            @PathVariable String id,
            @RequestBody Map<String, String> request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = employeeInvitationService.acceptInvitation(
                id,
                email,
                request.get("password"),
                request.get("fullName")
        );
        return ResponseEntity.ok(user);
    }

    @PutMapping("/invitations/{id}/reject")
    @PreAuthorize("hasRole('EMPLOYEE') or hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<?> rejectInvitation(
            @PathVariable String id,
            @RequestBody Map<String, String> request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        String reason = request.getOrDefault("reason", "No reason provided");
        employeeInvitationService.rejectInvitation(id, email, reason);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/invitations/history")
    @PreAuthorize("hasRole('EMPLOYEE') or hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<List<InvitationDTO>> getInvitationHistory() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(
                employeeInvitationService.getInvitationHistory(email)
        );
    }

    @DeleteMapping("/invitations/{id}/delete")
    @PreAuthorize("hasRole('EMPLOYEE') or hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<?> deleteHistoryRecord(@PathVariable String id) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        employeeInvitationService.deleteHistoryRecord(id, email);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/invitations/history/clear")
    @PreAuthorize("hasRole('EMPLOYEE') or hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<?> clearHistory(@RequestBody Map<String, String> request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        employeeInvitationService.clearHistory(email);
        return ResponseEntity.ok().build();
    }

    // ===== SCHEDULE ENDPOINTS =====
    @GetMapping("/schedules/upcoming")
    @PreAuthorize("hasRole('EMPLOYEE') or hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<List<ScheduleResponseDTO>> getUpcomingSchedules() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(employeeScheduleService.getUpcomingSchedules(email));
    }

    @GetMapping("/schedules")
    @PreAuthorize("hasRole('EMPLOYEE') or hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<List<ScheduleResponseDTO>> getMySchedules(
            @RequestParam(required = false) String view,
            @RequestParam(required = false) String date) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(employeeScheduleService.getMySchedules(email, view, date));
    }

    // ===== SWAP ENDPOINTS =====
    @GetMapping("/swaps")
    @PreAuthorize("hasRole('EMPLOYEE') or hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<List<SwapResponseDTO>> getMySwapRequests() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(employeeSwapService.getMySwapRequests(email));
    }

    @GetMapping("/swaps/incoming")
    @PreAuthorize("hasRole('EMPLOYEE') or hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<List<SwapResponseDTO>> getIncomingSwapRequests() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(employeeSwapService.getIncomingSwapRequests(email));
    }

    @PostMapping("/swaps")
    @PreAuthorize("hasRole('EMPLOYEE') or hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<SwapResponseDTO> createSwapRequest(@RequestBody SwapRequestDTO request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.status(201).body(employeeSwapService.createSwapRequest(email, request));
    }

    @PutMapping("/swaps/{id}/accept")
    @PreAuthorize("hasRole('EMPLOYEE') or hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<SwapResponseDTO> acceptSwapRequest(@PathVariable String id) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(employeeSwapService.acceptIncomingSwap(email, id));
    }

    @PutMapping("/swaps/{id}/reject")
    @PreAuthorize("hasRole('EMPLOYEE') or hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<SwapResponseDTO> rejectSwapRequest(@PathVariable String id) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(employeeSwapService.rejectIncomingSwap(email, id));
    }

    // ===== TASK ENDPOINTS =====
    @GetMapping("/tasks")
    @PreAuthorize("hasRole('EMPLOYEE') or hasRole('MANAGER') or hasRole('ADMIN')")
    @Transactional(readOnly = true)
    public ResponseEntity<List<Task>> getMyTasks() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        try {
            List<Task> tasks = employeeTaskService.getMyTasks(email);
            return ResponseEntity.ok(tasks);
        } catch (Exception e) {
            log.error("Error getting tasks: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/tasks/stats")
    @PreAuthorize("hasRole('EMPLOYEE') or hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<EmployeeTaskService.TaskStats> getMyTaskStats() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        EmployeeTaskService.TaskStats stats = employeeTaskService.getTaskStats(email);
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/projects/{projectId}/tasks")
    @PreAuthorize("hasRole('EMPLOYEE') or hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<List<Task>> getMyTasksByProject(@PathVariable String projectId) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        List<Task> tasks = employeeTaskService.getMyTasksByProject(email, projectId);
        return ResponseEntity.ok(tasks);
    }

    @PutMapping("/tasks/{id}/progress")
    @PreAuthorize("hasRole('EMPLOYEE') or hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<Task> updateTaskProgress(
            @PathVariable String id,
            @RequestBody Map<String, Integer> request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        Integer progress = request.get("progress");
        return ResponseEntity.ok(employeeTaskService.updateTaskProgress(email, id, progress));
    }

    @PostMapping("/tasks/{id}/submit")
    @PreAuthorize("hasRole('EMPLOYEE') or hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<Task> submitTask(@PathVariable String id) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(employeeTaskService.submitTaskForReview(email, id));
    }

    @PutMapping("/tasks/{id}/resubmit")
    @PreAuthorize("hasRole('EMPLOYEE') or hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<Task> resubmitTask(
            @PathVariable String id,
            @RequestBody Map<String, String> request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        String note = request.getOrDefault("note", "Task resubmitted for review");
        return ResponseEntity.ok(taskService.resubmitTask(email, id, note));
    }

    // ===== PROJECT ENDPOINTS =====
    @GetMapping("/projects")
    @PreAuthorize("hasRole('EMPLOYEE') or hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<List<ProjectDTO>> getMyProjects() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        List<ProjectDTO> projects = employeeProjectService.getMyProjects(email);
        return ResponseEntity.ok(projects);
    }

    // ===== TEAM MEMBERS ENDPOINT =====
    @GetMapping("/team-members")
    @PreAuthorize("hasRole('EMPLOYEE') or hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<List<TeamMemberDTO>> getTeamMembers() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();

        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if ("EMPLOYEE".equals(currentUser.getRole())) {
            if (currentUser.getManagerId() == null) {
                return ResponseEntity.ok(new ArrayList<>());
            }
            List<User> teamMembers = userRepository.findByManagerId(currentUser.getManagerId());
            List<TeamMemberDTO> result = teamMembers.stream()
                    .filter(u -> !u.getId().equals(currentUser.getId()))
                    .map(this::convertUserToTeamMemberDTO)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(result);
        }

        List<TeamMemberDTO> team = managerTeamService.getTeamMembers(email);
        return ResponseEntity.ok(team);
    }

    // ===== HELPER METHOD =====
    private TeamMemberDTO convertUserToTeamMemberDTO(User user) {
        return TeamMemberDTO.builder()
                .id(user.getId())
                .name(user.getFullName())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .department(user.getDepartment() != null ? user.getDepartment() : "IT")
                .position(user.getPosition() != null ? user.getPosition() : "Team Member")
                .status(user.getIsActive() ? "ACTIVE" : "INACTIVE")
                .build();
    }

    // ===== PROFILE ENDPOINTS =====
    @GetMapping("/profile")
    public ResponseEntity<ProfileResponseDTO> getProfile() {
        return ResponseEntity.ok(profileService.getCurrentUserProfile());
    }

    @PutMapping("/profile")
    public ResponseEntity<ProfileResponseDTO> updateProfile(@Valid @RequestBody ProfileUpdateRequest request) {
        return ResponseEntity.ok(profileService.updateProfile(request));
    }

    @PostMapping("/profile/photo")
    public ResponseEntity<Map<String, String>> uploadPhoto(@RequestBody Map<String, String> request) {
        String photoBase64 = request.get("photo");
        String photoUrl = profileService.uploadProfilePhoto(photoBase64);

        Map<String, String> response = new HashMap<>();
        response.put("photoUrl", photoUrl);
        response.put("message", "Photo uploaded successfully");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/profile/change-password")
    public ResponseEntity<Map<String, String>> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        profileService.changePassword(request);

        Map<String, String> response = new HashMap<>();
        response.put("message", "Password changed successfully");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/profile/photo-history")
    public ResponseEntity<List<PhotoHistoryDTO>> getPhotoHistory() {
        return ResponseEntity.ok(profileService.getPhotoHistory());
    }

    @PostMapping("/profile/photo-history")
    public ResponseEntity<PhotoHistoryDTO> savePhotoHistory(@RequestBody Map<String, String> request) {
        String photo = request.get("photo");
        String type = request.getOrDefault("type", "UPLOADED");
        PhotoHistoryDTO saved = profileService.savePhotoHistory(photo, type);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @DeleteMapping("/profile/photo-history/{id}")
    public ResponseEntity<Map<String, String>> deletePhotoHistory(@PathVariable String id) {
        profileService.deletePhotoHistory(id);

        Map<String, String> response = new HashMap<>();
        response.put("message", "Photo history deleted successfully");
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/profile/photo-history/clear")
    public ResponseEntity<Map<String, String>> clearPhotoHistory() {
        profileService.clearPhotoHistory();

        Map<String, String> response = new HashMap<>();
        response.put("message", "All photo history cleared successfully");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/profile/photo-history/revert/{id}")
    public ResponseEntity<Map<String, String>> revertToPhoto(@PathVariable String id) {
        String photoUrl = profileService.revertToPhoto(id);

        Map<String, String> response = new HashMap<>();
        response.put("photoUrl", photoUrl);
        response.put("message", "Photo reverted successfully");
        return ResponseEntity.ok(response);
    }


    // ===== NOTIFICATION ENDPOINTS (ONLY ONE) =====


}