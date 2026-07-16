// src/main/java/com/schedulepro/admin/controller/AdminProjectController.java
package com.schedulepro.admin.controller;

import com.schedulepro.admin.dto.request.ProjectRequestDTO;
import com.schedulepro.admin.dto.response.ProjectResponseDTO;
import com.schedulepro.admin.dto.response.ProjectStatsDTO;
import com.schedulepro.admin.service.AdminProjectService;
import com.schedulepro.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.List;

@RestController
@RequestMapping("/api/admin/projects")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
@Slf4j
public class AdminProjectController {

    private final AdminProjectService adminProjectService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ProjectResponseDTO>>> getAllProjects() {
        log.info("GET /api/admin/projects - Fetching all projects");
        List<ProjectResponseDTO> projects = adminProjectService.getAllProjects();
        return ResponseEntity.ok(ApiResponse.success("Projects fetched successfully", projects));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProjectResponseDTO>> getProjectById(@PathVariable String id) {
        log.info("GET /api/admin/projects/{} - Fetching project", id);
        ProjectResponseDTO project = adminProjectService.getProjectById(id);
        return ResponseEntity.ok(ApiResponse.success("Project fetched successfully", project));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ProjectResponseDTO>> createProject(
            @Valid @RequestBody ProjectRequestDTO request,
            Authentication authentication) {

        // ✅ Log the incoming request
        log.info("📋 Received project request: {}", request);
        log.info("📋 Name: {}", request.getName());
        log.info("📋 Start Date: {}", request.getStartDate());
        log.info("📋 End Date: {}", request.getEndDate());
        log.info("📋 Priority: {}", request.getPriority());
        log.info("📋 Status: {}", request.getStatus());

        String adminEmail = authentication.getName();
        log.info("👤 Admin: {}", adminEmail);

        ProjectResponseDTO created = adminProjectService.createProject(request, adminEmail);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Project created successfully", created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ProjectResponseDTO>> updateProject(
            @PathVariable String id,
            @Valid @RequestBody ProjectRequestDTO request) {
        log.info("PUT /api/admin/projects/{} - Updating project", id);
        ProjectResponseDTO updated = adminProjectService.updateProject(id, request);
        return ResponseEntity.ok(ApiResponse.success("Project updated successfully", updated));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<ApiResponse<ProjectResponseDTO>> updateProjectStatus(
            @PathVariable String id,
            @RequestBody Map<String, String> request) {
        log.info("PUT /api/admin/projects/{}/status - Updating project status", id);
        String status = request.get("status");
        ProjectResponseDTO updated = adminProjectService.updateProjectStatus(id, status);
        return ResponseEntity.ok(ApiResponse.success("Project status updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteProject(@PathVariable String id) {
        log.info("DELETE /api/admin/projects/{} - Deleting project", id);
        adminProjectService.deleteProject(id);
        return ResponseEntity.ok(ApiResponse.success("Project deleted successfully", null));
    }

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<ProjectStatsDTO>> getProjectStats() {
        log.info("GET /api/admin/projects/stats - Fetching project statistics");
        ProjectStatsDTO stats = adminProjectService.getProjectStats();
        return ResponseEntity.ok(ApiResponse.success("Project statistics fetched successfully", stats));
    }
}