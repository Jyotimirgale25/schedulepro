// src/main/java/com/schedulepro/admin/service/AdminTaskService.java
package com.schedulepro.admin.service;

import com.schedulepro.admin.dto.request.TaskRequestDTO;
import com.schedulepro.admin.dto.response.TaskResponseDTO;
import com.schedulepro.admin.dto.response.TaskStatsDTO;
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

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class AdminTaskService {

    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    public List<TaskResponseDTO> getAllTasks() {
        log.info("Admin fetching all tasks");
        List<Task> tasks = taskRepository.findAll();
        return tasks.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public TaskResponseDTO getTaskById(String taskId) {
        log.info("Admin fetching task by ID: {}", taskId);
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));
        return convertToDTO(task);
    }

    public List<TaskResponseDTO> getTasksByProject(String projectId) {
        log.info("Admin fetching tasks for project: {}", projectId);
        List<Task> tasks = taskRepository.findByProjectId(projectId);
        return tasks.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public TaskResponseDTO createTask(TaskRequestDTO request, String adminEmail) {
        log.info("Admin {} creating new task", adminEmail);

        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new RuntimeException("Admin not found"));

        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new RuntimeException("Project not found"));

        User assignedTo = userRepository.findById(String.valueOf(UUID.fromString(request.getAssignedTo())))
                .orElseThrow(() -> new RuntimeException("Assigned user not found"));

        Task task = new Task();
        task.setTitle(request.getTitle());
        task.setDescription(request.getDescription());
        task.setProject(project);
        task.setAssignedTo(assignedTo);
        task.setAssignedBy(admin.getId().toString());
        task.setPriority(request.getPriority());
        task.setDueDate(request.getDueDate());
        task.setStatus("PENDING");
        task.setProgress(0);
        task.setCreatedBy(admin.getId().toString());

        Task saved = taskRepository.save(task);
        log.info("Task created with ID: {}", saved.getId());

        return convertToDTO(saved);
    }

    @Transactional
    public TaskResponseDTO updateTask(String taskId, TaskRequestDTO request) {
        log.info("Admin updating task: {}", taskId);

        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        if (request.getTitle() != null) task.setTitle(request.getTitle());
        if (request.getDescription() != null) task.setDescription(request.getDescription());
        if (request.getPriority() != null) task.setPriority(request.getPriority());
        if (request.getDueDate() != null) task.setDueDate(request.getDueDate());
        if (request.getStatus() != null) {
            task.setStatus(request.getStatus());
            if ("APPROVED".equals(request.getStatus())) {
                task.setCompletedAt(LocalDateTime.now());
            }
        }
        if (request.getProgress() != null) task.setProgress(request.getProgress());

        task.setUpdatedAt(LocalDateTime.now());

        Task updated = taskRepository.save(task);
        log.info("Task updated: {}", taskId);

        return convertToDTO(updated);
    }

    @Transactional
    public TaskResponseDTO approveTask(String taskId, String adminEmail, String feedback) {
        log.info("Admin {} approving task: {}", adminEmail, taskId);

        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new RuntimeException("Admin not found"));

        task.setStatus("APPROVED");
        task.setApprovedBy(admin.getId().toString());
        task.setApprovedAt(LocalDateTime.now());
        task.setCompletedAt(LocalDateTime.now());
        task.setProgress(100);
        task.setFeedback(feedback);
        task.setUpdatedAt(LocalDateTime.now());

        Task updated = taskRepository.save(task);
        log.info("Task approved: {}", taskId);

        return convertToDTO(updated);
    }

    @Transactional
    public TaskResponseDTO rejectTask(String taskId, String adminEmail, String reason) {
        log.info("Admin {} rejecting task: {}", adminEmail, taskId);

        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        task.setStatus("REJECTED");
        task.setRejectionReason(reason);
        task.setRejectionNote(reason);
        task.setUpdatedAt(LocalDateTime.now());

        Task updated = taskRepository.save(task);
        log.info("Task rejected: {}", taskId);

        return convertToDTO(updated);
    }

    @Transactional
    public void deleteTask(String taskId) {
        log.info("Admin deleting task: {}", taskId);
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));
        taskRepository.delete(task);
        log.info("Task deleted: {}", taskId);
    }

    public TaskStatsDTO getTaskStats() {
        log.info("Admin fetching task statistics");

        long totalTasks = taskRepository.count();
        long pendingTasks = taskRepository.countByStatus("PENDING");
        long inProgressTasks = taskRepository.countByStatus("IN_PROGRESS");
        long submittedTasks = taskRepository.countByStatus("SUBMITTED");
        long approvedTasks = taskRepository.countByStatus("APPROVED");
        long rejectedTasks = taskRepository.countByStatus("REJECTED");

        long completionRate = totalTasks > 0 ? (approvedTasks * 100 / totalTasks) : 0;

        return TaskStatsDTO.builder()
                .totalTasks(totalTasks)
                .pendingTasks(pendingTasks)
                .inProgressTasks(inProgressTasks)
                .submittedTasks(submittedTasks)
                .approvedTasks(approvedTasks)
                .rejectedTasks(rejectedTasks)
                .completionRate(completionRate)
                .build();
    }

    private TaskResponseDTO convertToDTO(Task task) {
        String projectName = task.getProject() != null ? task.getProject().getName() : null;

        String assignedToName = null;
        String assignedToEmail = null;
        if (task.getAssignedTo() != null) {
            assignedToName = task.getAssignedTo().getFullName();
            assignedToEmail = task.getAssignedTo().getEmail();
        }

        String assignedByName = null;
        if (task.getAssignedBy() != null) {
            try {
                User assignedByUser = userRepository.findById(String.valueOf(UUID.fromString(task.getAssignedBy())))
                        .orElse(null);
                if (assignedByUser != null) {
                    assignedByName = assignedByUser.getFullName();
                }
            } catch (IllegalArgumentException e) {
                // Invalid UUID
            }
        }

        String createdByName = null;
        if (task.getCreatedBy() != null) {
            try {
                User createdByUser = userRepository.findById(String.valueOf(UUID.fromString(task.getCreatedBy())))
                        .orElse(null);
                if (createdByUser != null) {
                    createdByName = createdByUser.getFullName();
                }
            } catch (IllegalArgumentException e) {
                // Invalid UUID
            }
        }

        String approvedByName = null;
        if (task.getApprovedBy() != null) {
            try {
                User approvedByUser = userRepository.findById(String.valueOf(UUID.fromString(task.getApprovedBy())))
                        .orElse(null);
                if (approvedByUser != null) {
                    approvedByName = approvedByUser.getFullName();
                }
            } catch (IllegalArgumentException e) {
                // Invalid UUID
            }
        }

        return TaskResponseDTO.builder()
                .id(task.getId())
                .title(task.getTitle())
                .description(task.getDescription())
                .projectId(task.getProject() != null ? task.getProject().getId() : null)
                .projectName(projectName)
                .assignedTo(task.getAssignedTo() != null ? task.getAssignedTo().getId().toString() : null)
                .assignedToName(assignedToName)
                .assignedToEmail(assignedToEmail)
                .assignedBy(task.getAssignedBy())
                .assignedByName(assignedByName)
                .priority(task.getPriority())
                .dueDate(task.getDueDate())
                .status(task.getStatus())
                .progress(task.getProgress())
                .createdBy(task.getCreatedBy())
                .createdByName(createdByName)
                .approvedBy(task.getApprovedBy())
                .approvedByName(approvedByName)
                .approvedAt(task.getApprovedAt())
                .submittedAt(task.getSubmittedAt())
                .completedAt(task.getCompletedAt())
                .rejectionReason(task.getRejectionReason())
                .rejectionNote(task.getRejectionNote())
                .resubmissionNote(task.getResubmissionNote())
                .feedback(task.getFeedback())
                .createdAt(task.getCreatedAt())
                .updatedAt(task.getUpdatedAt())
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

            int totalProgress = tasks.stream()
                    .mapToInt(t -> t.getProgress() != null ? t.getProgress() : 0)
                    .sum();

            int averageProgress = totalProgress / tasks.size();
            project.setProgress(averageProgress);
            projectRepository.save(project);

        } catch (Exception e) {
            log.error("❌ Error updating project progress: {}", e.getMessage());
        }
    }
    private void checkAndUpdateProjectStatus(Project project) {
        if (project == null) return;

        List<Task> tasks = taskRepository.findByProjectId(project.getId());

        if (tasks.isEmpty()) {
            project.setStatus("PLANNED");
            project.setProgress(0);
            projectRepository.save(project);
            return;
        }

        // ✅ Count completed tasks (APPROVED)
        long completedCount = tasks.stream()
                .filter(t -> "APPROVED".equals(t.getStatus()))
                .count();

        // ✅ Calculate progress
        int progress = (int) ((completedCount * 100) / tasks.size());
        project.setProgress(progress);

        // ✅ Auto-complete if all tasks are approved
        if (completedCount == tasks.size()) {
            project.setStatus("COMPLETED");
            log.info("🎉 Project '{}' auto-completed! All {} tasks approved.",
                    project.getName(), tasks.size());
        } else {
            project.setStatus("ACTIVE");
        }

        projectRepository.save(project);
    }
}