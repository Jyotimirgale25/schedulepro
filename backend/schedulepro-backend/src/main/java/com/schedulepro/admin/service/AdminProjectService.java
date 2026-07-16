// src/main/java/com/schedulepro/admin/service/AdminProjectService.java
package com.schedulepro.admin.service;

import com.schedulepro.admin.dto.request.ProjectRequestDTO;
import com.schedulepro.admin.dto.response.ProjectResponseDTO;
import com.schedulepro.admin.dto.response.ProjectStatsDTO;
import com.schedulepro.auth.entity.User;
import com.schedulepro.auth.repository.UserRepository;
import com.schedulepro.employee.entity.Project;
import com.schedulepro.employee.entity.Task;
import com.schedulepro.employee.repository.ProjectRepository;
import com.schedulepro.employee.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class AdminProjectService {

    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;

    public List<ProjectResponseDTO> getAllProjects() {
        log.info("Admin fetching all projects");
        List<Project> projects = projectRepository.findAllByOrderByCreatedAtDesc();
        return projects.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public ProjectResponseDTO getProjectById(String projectId) {
        log.info("Admin fetching project by ID: {}", projectId);
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));
        return convertToDTO(project);
    }

    @Transactional
    public ProjectResponseDTO createProject(ProjectRequestDTO request, String adminEmail) {
        log.info("Admin {} creating new project", adminEmail);

        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new RuntimeException("Admin not found"));

        Project project = new Project();
        project.setName(request.getName());
        project.setDescription(request.getDescription());
        project.setStartDate(request.getStartDate());
        project.setEndDate(request.getEndDate());
        project.setPriority(request.getPriority());
        project.setStatus("PLANNED");
        project.setProgress(0);
        project.setCreatedBy(admin.getId().toString());

        Project saved = projectRepository.save(project);
        log.info("Project created with ID: {}", saved.getId());

        return convertToDTO(saved);
    }

    @Transactional
    public ProjectResponseDTO updateProject(String projectId, ProjectRequestDTO request) {
        log.info("Admin updating project: {}", projectId);

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        project.setName(request.getName());
        project.setDescription(request.getDescription());
        project.setStartDate(request.getStartDate());
        project.setEndDate(request.getEndDate());
        project.setPriority(request.getPriority());
        if (request.getStatus() != null) {
            project.setStatus(request.getStatus());
        }

        Project updated = projectRepository.save(project);
        log.info("Project updated: {}", projectId);

        return convertToDTO(updated);
    }

    @Transactional
    public ProjectResponseDTO updateProjectStatus(String projectId, String status) {
        log.info("Admin updating project status: {} to {}", projectId, status);

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        project.setStatus(status);
        if ("COMPLETED".equals(status)) {
            project.setProgress(100);
        }

        Project updated = projectRepository.save(project);
        log.info("Project status updated: {}", projectId);

        return convertToDTO(updated);
    }

    @Transactional
    public void deleteProject(String projectId) {
        log.info("Admin deleting project: {}", projectId);

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        // Delete all tasks associated with this project
        taskRepository.deleteByProjectId(projectId);

        // Delete the project
        projectRepository.delete(project);
        log.info("Project and its tasks deleted: {}", projectId);
    }

    public ProjectStatsDTO getProjectStats() {
        log.info("Admin fetching project statistics");

        long totalProjects = projectRepository.count();

        // ✅ Fix: Count ALL statuses properly
        long plannedProjects = projectRepository.countByStatus("PLANNED");
        long activeProjects = projectRepository.countByStatus("ACTIVE");      // ← CHANGED
        long inProgressProjects = projectRepository.countByStatus("IN_PROGRESS");
        long completedProjects = projectRepository.countByStatus("COMPLETED");
        long onHoldProjects = projectRepository.countByStatus("ON_HOLD");
        long cancelledProjects = projectRepository.countByStatus("CANCELLED");

        // ✅ Combine ACTIVE + IN_PROGRESS for display
        long inProgressTotal = activeProjects + inProgressProjects;

        long totalTasks = taskRepository.count();
        long completedTasks = taskRepository.countByStatus("COMPLETED");

        return ProjectStatsDTO.builder()
                .totalProjects(totalProjects)
                .plannedProjects(plannedProjects)
                .inProgressProjects(inProgressTotal)  // ← FIXED
                .completedProjects(completedProjects)
                .onHoldProjects(onHoldProjects)
                .cancelledProjects(cancelledProjects)
                .totalTasks(totalTasks)
                .completedTasks(completedTasks)
                .build();
    }

    private ProjectResponseDTO convertToDTO(Project project) {
        // Get task counts
        List<Task> tasks = taskRepository.findByProjectId(project.getId());
        long taskCount = tasks.size();
        long completedCount = tasks.stream()
                .filter(t -> "COMPLETED".equals(t.getStatus()) || "APPROVED".equals(t.getStatus()))
                .count();

        // ✅ Calculate average progress from tasks
        int progress = 0;
        if (taskCount > 0) {
            int totalProgress = tasks.stream()
                    .mapToInt(t -> t.getProgress() != null ? t.getProgress() : 0)
                    .sum();
            progress = totalProgress / (int) taskCount;
        }

        String createdByName = null;
        if (project.getCreatedBy() != null && !project.getCreatedBy().isEmpty()) {
            try {
                User creator = userRepository.findById(project.getCreatedBy())
                        .orElse(null);
                if (creator != null) {
                    createdByName = creator.getFullName();
                }
            } catch (IllegalArgumentException e) {
                // Invalid UUID format
            }
        }

        String managerName = null;
        if (project.getManagerId() != null && !project.getManagerId().isEmpty()) {
            try {
                User manager = userRepository.findById(project.getManagerId())
                        .orElse(null);
                if (manager != null) {
                    managerName = manager.getFullName();
                }
            } catch (IllegalArgumentException e) {
                // Invalid UUID format
            }
        }

        return ProjectResponseDTO.builder()
                .id(project.getId())
                .name(project.getName())
                .description(project.getDescription())
                .startDate(project.getStartDate())
                .endDate(project.getEndDate())
                .priority(project.getPriority())
                .status(project.getStatus())
                .progress(progress)  // ✅ Use calculated average progress
                .createdBy(project.getCreatedBy())
                .createdByName(createdByName)
                .managerId(project.getManagerId())
                .managerName(managerName)
                .taskCount(taskCount)
                .completedCount(completedCount)
                .createdAt(project.getCreatedAt())
                .updatedAt(project.getUpdatedAt())
                .build();
    }
    private void updateProjectProgress(Project project) {
        if (project == null) return;

        try {
            List<Task> tasks = taskRepository.findByProjectId(project.getId());

            if (tasks.isEmpty()) {
                project.setProgress(0);
                projectRepository.save(project);
                return;
            }

            // ✅ Calculate average progress from all tasks
            int totalProgress = tasks.stream()
                    .mapToInt(t -> t.getProgress() != null ? t.getProgress() : 0)
                    .sum();

            int averageProgress = totalProgress / tasks.size();

            project.setProgress(averageProgress);
            projectRepository.save(project);

            log.info("📊 Project '{}' progress updated to: {}%", project.getName(), averageProgress);

        } catch (Exception e) {
            log.error("❌ Error updating project progress: {}", e.getMessage());
        }
    }
}