// src/main/java/com/schedulepro/employee/service/EmployeeProjectService.java
package com.schedulepro.employee.service;

import com.schedulepro.employee.entity.Project;
import com.schedulepro.employee.repository.ProjectRepository;
import com.schedulepro.auth.entity.User;
import com.schedulepro.auth.repository.UserRepository;
import com.schedulepro.common.exception.ResourceNotFoundException;
import com.schedulepro.manager.dto.response.ProjectDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmployeeProjectService {

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    public List<ProjectDTO> getMyProjects(String email) {
        User employee = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // ✅ Pass employee.getId() - String
        List<Project> projects = projectRepository.findProjectsByAssignedUser(employee.getId());

        return projects.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

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
}