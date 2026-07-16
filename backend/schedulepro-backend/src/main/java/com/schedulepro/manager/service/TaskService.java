// src/main/java/com/schedulepro/manager/service/TaskService.java
package com.schedulepro.manager.service;

import com.schedulepro.employee.entity.Project;
import com.schedulepro.employee.entity.Task;
import com.schedulepro.employee.repository.ProjectRepository;
import com.schedulepro.employee.repository.TaskRepository;
import com.schedulepro.auth.entity.User;
import com.schedulepro.auth.repository.UserRepository;
import com.schedulepro.common.exception.BadRequestException;
import com.schedulepro.common.exception.ResourceNotFoundException;
import com.schedulepro.employee.service.NotificationHelper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TaskService {

    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final NotificationHelper notificationHelper;

    // ============================================
    // GET TASKS FOR MANAGER - FIXED
    // ============================================
    @Transactional(readOnly = true)
    public List<Task> getTasksForManager(String managerEmail) {
        try {
            User manager = userRepository.findByEmail(managerEmail)
                    .orElseThrow(() -> new ResourceNotFoundException("Manager not found"));

            log.info("📊 Getting tasks for manager: {}", manager.getEmail());

            // ✅ FIX: Pass String ID, not User object
            List<Project> projects = projectRepository.findByCreatedByOrderByCreatedAtDesc(manager.getId());

            log.info("📁 Found {} projects for manager", projects.size());

            if (projects.isEmpty()) {
                log.info("📋 No projects found, returning empty task list");
                return new ArrayList<>();
            }

            List<String> projectIds = projects.stream()
                    .map(Project::getId)
                    .collect(Collectors.toList());

            // ✅ FIX: Use findByProjectIdIn (already exists)
            List<Task> tasks = taskRepository.findByProjectIdIn(projectIds);

            log.info("✅ Found {} tasks for manager", tasks.size());
            return tasks;

        } catch (Exception e) {
            log.error("❌ Error getting tasks for manager: {}", e.getMessage(), e);
            return new ArrayList<>();
        }
    }

    // ============================================
    // GET TASKS FOR PROJECT
    // ============================================
    @Transactional(readOnly = true)
    public List<Task> getTasksForProject(String projectId) {
        log.info("📋 Getting tasks for project: {}", projectId);
        List<Task> tasks = taskRepository.findByProjectId(projectId);
        log.info("📋 Tasks found for project: {}", tasks.size());
        return tasks;
    }

    // ============================================
    // GET TASK BY ID
    // ============================================
    @Transactional(readOnly = true)
    public Task getTaskById(String taskId) {
        return taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));
    }

    // ============================================
    // CREATE TASK
    // ============================================
    @Transactional
    public Task createTask(String managerEmail, Task task) {
        User manager = userRepository.findByEmail(managerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Manager not found"));

        if (task.getProject() == null || task.getProject().getId() == null) {
            throw new BadRequestException("Project ID is required");
        }

        Project project = projectRepository.findById(task.getProject().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

        if (!project.getCreatedBy().equals(manager.getId())) {
            throw new BadRequestException("You don't have permission to add tasks to this project");
        }

        User assignedTo = null;
        if (task.getAssignedTo() != null && task.getAssignedTo().getId() != null) {
            assignedTo = userRepository.findById(task.getAssignedTo().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Assigned user not found"));
        }

        task.setProject(project);
        task.setAssignedTo(assignedTo);
        task.setStatus("PENDING");
        task.setProgress(0);
        task.setCreatedBy(manager.getId());
        task.setCreatedAt(LocalDateTime.now());

        Task savedTask = taskRepository.save(task);

        if (assignedTo != null) {
            notificationHelper.notifyTaskAssigned(
                    assignedTo.getId(),
                    manager.getId(),
                    manager.getFullName(),
                    task.getTitle(),
                    project.getName()
            );
        }

        log.info("✅ Task created by {}: {}", manager.getFullName(), task.getTitle());
        return savedTask;
    }

    // ============================================
    // APPROVE TASK
    // ============================================
    @Transactional
    public Task approveTask(String managerEmail, String taskId, String comments) {
        User manager = userRepository.findByEmail(managerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Manager not found"));

        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));

        Project project = task.getProject();
        if (project == null || !project.getCreatedBy().equals(manager.getId())) {
            throw new BadRequestException("You don't have permission to approve this task");
        }

        task.setStatus("APPROVED");
        task.setApprovedBy(manager.getId());
        task.setApprovedAt(LocalDateTime.now());
        task.setFeedback(comments);
        task.setUpdatedAt(LocalDateTime.now());

        Task updatedTask = taskRepository.save(task);

        if (task.getAssignedTo() != null) {
            notificationHelper.notifyTaskApproved(
                    task.getAssignedTo().getId(),
                    manager.getId(),
                    manager.getFullName(),
                    task.getTitle()
            );
        }

        log.info("✅ Task approved by {}: {}", manager.getFullName(), task.getTitle());
        return updatedTask;
    }

    // ============================================
    // REJECT TASK
    // ============================================
    @Transactional
    public Task rejectTask(String managerEmail, String taskId, String reason) {
        User manager = userRepository.findByEmail(managerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Manager not found"));

        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));

        Project project = task.getProject();
        if (project == null || !project.getCreatedBy().equals(manager.getId())) {
            throw new BadRequestException("You don't have permission to reject this task");
        }

        task.setStatus("REJECTED");
        task.setApprovedBy(manager.getId());
        task.setApprovedAt(LocalDateTime.now());
        task.setRejectionReason(reason);
        task.setRejectionNote(reason);
        task.setFeedback(reason);
        task.setUpdatedAt(LocalDateTime.now());

        Task updatedTask = taskRepository.save(task);

        if (task.getAssignedTo() != null) {
            notificationHelper.notifyTaskRejected(
                    task.getAssignedTo().getId(),
                    manager.getId(),
                    manager.getFullName(),
                    task.getTitle(),
                    reason
            );
        }

        log.info("❌ Task rejected by {}: {}", manager.getFullName(), task.getTitle());
        return updatedTask;
    }

    // ============================================
    // RESUBMIT TASK
    // ============================================
    @Transactional
    public Task resubmitTask(String employeeEmail, String taskId, String note) {
        User employee = userRepository.findByEmail(employeeEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));

        if (task.getAssignedTo() == null || !task.getAssignedTo().getId().equals(employee.getId())) {
            throw new BadRequestException("You can only resubmit your own tasks");
        }

        if (!"REJECTED".equals(task.getStatus())) {
            throw new BadRequestException("Only rejected tasks can be resubmitted");
        }

        task.setStatus("SUBMITTED");
        task.setResubmissionNote(note);
        task.setFeedback(note);
        task.setSubmittedAt(LocalDateTime.now());
        task.setUpdatedAt(LocalDateTime.now());

        Task updatedTask = taskRepository.save(task);

        User manager = userRepository.findById(task.getCreatedBy()).orElse(null);
        if (manager != null) {
            notificationHelper.notifyTaskSubmitted(
                    manager.getId(),
                    employee.getId(),
                    employee.getFullName(),
                    task.getTitle()
            );
        }

        log.info("🔄 Task resubmitted by {}: {}", employee.getFullName(), task.getTitle());
        return updatedTask;
    }
}