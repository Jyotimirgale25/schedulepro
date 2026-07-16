// src/main/java/com/schedulepro/admin/controller/AdminTaskController.java
package com.schedulepro.admin.controller;

import com.schedulepro.admin.dto.request.TaskRequestDTO;
import com.schedulepro.admin.dto.response.TaskResponseDTO;
import com.schedulepro.admin.dto.response.TaskStatsDTO;
import com.schedulepro.admin.service.AdminTaskService;
import com.schedulepro.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/tasks")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
@Slf4j
public class AdminTaskController {

    private final AdminTaskService adminTaskService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<TaskResponseDTO>>> getAllTasks() {
        log.info("GET /api/admin/tasks - Fetching all tasks");
        List<TaskResponseDTO> tasks = adminTaskService.getAllTasks();
        return ResponseEntity.ok(ApiResponse.success("Tasks fetched successfully", tasks));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TaskResponseDTO>> getTaskById(@PathVariable String id) {
        log.info("GET /api/admin/tasks/{} - Fetching task", id);
        TaskResponseDTO task = adminTaskService.getTaskById(id);
        return ResponseEntity.ok(ApiResponse.success("Task fetched successfully", task));
    }

    @GetMapping("/project/{projectId}")
    public ResponseEntity<ApiResponse<List<TaskResponseDTO>>> getTasksByProject(@PathVariable String projectId) {
        log.info("GET /api/admin/tasks/project/{} - Fetching tasks for project", projectId);
        List<TaskResponseDTO> tasks = adminTaskService.getTasksByProject(projectId);
        return ResponseEntity.ok(ApiResponse.success("Tasks fetched successfully", tasks));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<TaskResponseDTO>> createTask(
            @Valid @RequestBody TaskRequestDTO request,
            Authentication authentication) {
        String adminEmail = authentication.getName();
        log.info("POST /api/admin/tasks - Creating new task");
        TaskResponseDTO created = adminTaskService.createTask(request, adminEmail);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Task created successfully", created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<TaskResponseDTO>> updateTask(
            @PathVariable String id,
            @Valid @RequestBody TaskRequestDTO request) {
        log.info("PUT /api/admin/tasks/{} - Updating task", id);
        TaskResponseDTO updated = adminTaskService.updateTask(id, request);
        return ResponseEntity.ok(ApiResponse.success("Task updated successfully", updated));
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<ApiResponse<TaskResponseDTO>> approveTask(
            @PathVariable String id,
            @RequestBody Map<String, String> request,
            Authentication authentication) {
        String adminEmail = authentication.getName();
        String feedback = request.get("feedback");
        log.info("PUT /api/admin/tasks/{}/approve - Approving task", id);
        TaskResponseDTO updated = adminTaskService.approveTask(id, adminEmail, feedback);
        return ResponseEntity.ok(ApiResponse.success("Task approved successfully", updated));
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<ApiResponse<TaskResponseDTO>> rejectTask(
            @PathVariable String id,
            @RequestBody Map<String, String> request,
            Authentication authentication) {
        String adminEmail = authentication.getName();
        String reason = request.get("reason");
        log.info("PUT /api/admin/tasks/{}/reject - Rejecting task", id);
        TaskResponseDTO updated = adminTaskService.rejectTask(id, adminEmail, reason);
        return ResponseEntity.ok(ApiResponse.success("Task rejected successfully", updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTask(@PathVariable String id) {
        log.info("DELETE /api/admin/tasks/{} - Deleting task", id);
        adminTaskService.deleteTask(id);
        return ResponseEntity.ok(ApiResponse.success("Task deleted successfully", null));
    }

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<TaskStatsDTO>> getTaskStats() {
        log.info("GET /api/admin/tasks/stats - Fetching task statistics");
        TaskStatsDTO stats = adminTaskService.getTaskStats();
        return ResponseEntity.ok(ApiResponse.success("Task statistics fetched successfully", stats));
    }
}