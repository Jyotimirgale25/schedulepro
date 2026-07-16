// src/main/java/com/schedulepro/manager/service/ProjectService.java
package com.schedulepro.manager.service;

import com.schedulepro.employee.entity.Project;
import com.schedulepro.employee.repository.ProjectRepository;
import com.schedulepro.auth.entity.User;
import com.schedulepro.auth.repository.UserRepository;
import com.schedulepro.common.exception.ResourceNotFoundException;
import com.schedulepro.manager.dto.response.ProjectDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    @Transactional
    public Project createProject(String managerEmail, Project project) {
        User manager = userRepository.findByEmail(managerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Manager not found"));

        project.setCreatedBy(manager.getId());
        project.setManagerId(manager.getId());
        project.setProgress(0);
        project.setStatus("ACTIVE");
        project.setCreatedAt(LocalDateTime.now());
        project.setUpdatedAt(LocalDateTime.now());

        return projectRepository.save(project);
    }

    public List<ProjectDTO> getProjectsForManagerDTO(String managerEmail) {
        User manager = userRepository.findByEmail(managerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Manager not found"));

        List<Project> projects = projectRepository.findByCreatedByOrderByCreatedAtDesc(manager.getId());

        return projects.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<Project> getProjectsForManager(String managerEmail) {
        User manager = userRepository.findByEmail(managerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Manager not found"));

        return projectRepository.findByCreatedByOrderByCreatedAtDesc(manager.getId());
    }

    // ❌ REMOVE THIS LINE - it's not inside any method
    // List<Project> projects = projectRepository.findByManagerId(managerId);

    private ProjectDTO convertToDTO(Project project) {
        String creatorName = null;
        if (project.getCreatedBy() != null && !project.getCreatedBy().isEmpty()) {
            try {
                User creator = userRepository.findById(project.getCreatedBy()).orElse(null);
                if (creator != null) {
                    creatorName = creator.getFullName();
                }
            } catch (Exception e) {
                log.warn("Could not find creator for project: {}", project.getId());
            }
        }

        return ProjectDTO.builder()
                .id(project.getId())
                .name(project.getName())
                .description(project.getDescription())
                .startDate(project.getStartDate() != null ? project.getStartDate().toString() : null)
                .endDate(project.getEndDate() != null ? project.getEndDate().toString() : null)
                .priority(project.getPriority())
                .status(project.getStatus())
                .progress(project.getProgress())
                .createdBy(creatorName)
                .createdAt(project.getCreatedAt() != null ? project.getCreatedAt().toString() : null)
                .build();
    }

    public Project getProjectById(String projectId) {
        return projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
    }

    @Transactional
    public Project updateProject(String projectId, Project updatedProject) {
        Project existing = getProjectById(projectId);
        existing.setName(updatedProject.getName());
        existing.setDescription(updatedProject.getDescription());
        existing.setStartDate(updatedProject.getStartDate());
        existing.setEndDate(updatedProject.getEndDate());
        existing.setPriority(updatedProject.getPriority());
        existing.setStatus(updatedProject.getStatus());
        existing.setProgress(updatedProject.getProgress());
        existing.setUpdatedAt(LocalDateTime.now());

        return projectRepository.save(existing);
    }

    @Transactional
    public void deleteProject(String projectId) {
        Project project = getProjectById(projectId);
        projectRepository.delete(project);
        log.info("🗑️ Project deleted: {}", project.getName());
    }
}