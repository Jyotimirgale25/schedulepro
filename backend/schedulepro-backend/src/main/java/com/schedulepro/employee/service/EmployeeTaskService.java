// src/main/java/com/schedulepro/employee/service/EmployeeTaskService.java
package com.schedulepro.employee.service;

import com.schedulepro.auth.entity.User;
import com.schedulepro.auth.repository.UserRepository;
import com.schedulepro.common.exception.BadRequestException;
import com.schedulepro.common.exception.ResourceNotFoundException;
import com.schedulepro.employee.entity.Task;
import com.schedulepro.employee.repository.TaskRepository;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmployeeTaskService {

    private final TaskRepository taskRepository;
    private final UserRepository userRepository;

    // ============================================
    // GET TASKS FOR EMPLOYEE
    // ============================================
    public List<Task> getMyTasks(String email) {
        User employee = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // ✅ This is correct - findByAssignedTo expects User object
        List<Task> tasks = taskRepository.findByAssignedTo(employee);
        log.info("📋 Found {} tasks for {}", tasks.size(), email);
        return tasks;
    }

    // ============================================
    // GET TASK STATS
    // ============================================
    public TaskStats getTaskStats(String email) {
        User employee = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // ✅ This is correct - findByAssignedTo expects User object
        List<Task> tasks = taskRepository.findByAssignedTo(employee);

        int total = tasks.size();
        int completed = (int) tasks.stream()
                .filter(t -> "APPROVED".equals(t.getStatus()) || "COMPLETED".equals(t.getStatus()))
                .count();
        int inProgress = (int) tasks.stream()
                .filter(t -> "IN_PROGRESS".equals(t.getStatus()))
                .count();
        int pending = (int) tasks.stream()
                .filter(t -> "PENDING".equals(t.getStatus()))
                .count();
        int submitted = (int) tasks.stream()
                .filter(t -> "SUBMITTED".equals(t.getStatus()))
                .count();
        int rejected = (int) tasks.stream()
                .filter(t -> "REJECTED".equals(t.getStatus()))
                .count();

        double completionRate = total > 0 ? (double) completed / total * 100 : 0;

        return TaskStats.builder()
                .totalTasks(total)
                .completedTasks(completed)
                .inProgressTasks(inProgress)
                .pendingTasks(pending)
                .submittedTasks(submitted)
                .rejectedTasks(rejected)
                .completionRate(Math.round(completionRate))
                .build();
    }

    // ============================================
    // GET TASKS BY PROJECT
    // ============================================
    public List<Task> getMyTasksByProject(String email, String projectId) {
        User employee = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // ✅ This is correct - findByAssignedToAndProjectId expects User and String
        return taskRepository.findByAssignedToAndProjectId(employee, projectId);
    }

    // ============================================
    // UPDATE TASK PROGRESS
    // ============================================
    @Transactional
    public Task updateTaskProgress(String email, String taskId, Integer progress) {
        User employee = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));

        if (!task.getAssignedTo().getId().equals(employee.getId())) {
            throw new BadRequestException("You can only update your own tasks");
        }

        if (progress < 0 || progress > 100) {
            throw new BadRequestException("Progress must be between 0 and 100");
        }

        task.setProgress(progress);

        if (progress >= 100) {
            task.setStatus("SUBMITTED");
            task.setSubmittedAt(LocalDateTime.now());
        } else if (progress > 0) {
            task.setStatus("IN_PROGRESS");
        } else {
            task.setStatus("PENDING");
        }

        task.setUpdatedAt(LocalDateTime.now());
        return taskRepository.save(task);
    }

    // ============================================
    // SUBMIT TASK FOR REVIEW
    // ============================================
    @Transactional
    public Task submitTaskForReview(String email, String taskId) {
        User employee = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));

        if (!task.getAssignedTo().getId().equals(employee.getId())) {
            throw new BadRequestException("You can only submit your own tasks");
        }

        if (task.getProgress() < 100) {
            throw new BadRequestException("Task must be 100% complete before submitting");
        }

        task.setStatus("SUBMITTED");
        task.setSubmittedAt(LocalDateTime.now());
        task.setUpdatedAt(LocalDateTime.now());

        Task savedTask = taskRepository.save(task);
        log.info("📤 Task submitted by {}: {}", employee.getFullName(), task.getTitle());

        return savedTask;
    }

    // ============================================
    // RESUBMIT TASK
    // ============================================
    @Transactional
    public Task resubmitTask(String email, String taskId, String note) {
        User employee = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));

        if (!task.getAssignedTo().getId().equals(employee.getId())) {
            throw new BadRequestException("You can only resubmit your own tasks");
        }

        if (!"REJECTED".equals(task.getStatus())) {
            throw new BadRequestException("Only rejected tasks can be resubmitted");
        }

        task.setStatus("SUBMITTED");
        task.setResubmissionNote(note);
        task.setSubmittedAt(LocalDateTime.now());
        task.setUpdatedAt(LocalDateTime.now());

        Task savedTask = taskRepository.save(task);
        log.info("🔄 Task resubmitted by {}: {}", employee.getFullName(), task.getTitle());

        return savedTask;
    }

    // ============================================
    // INNER CLASS FOR STATS
    // ============================================
    @Data
    @Builder
    public static class TaskStats {
        private int totalTasks;
        private int completedTasks;
        private int inProgressTasks;
        private int pendingTasks;
        private int submittedTasks;
        private int rejectedTasks;
        private long completionRate;
    }
}