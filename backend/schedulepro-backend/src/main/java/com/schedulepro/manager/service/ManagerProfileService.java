// src/main/java/com/schedulepro/manager/service/ManagerProfileService.java
package com.schedulepro.manager.service;

import com.schedulepro.auth.entity.User;
import com.schedulepro.auth.repository.UserRepository;
import com.schedulepro.employee.entity.EmployeeDetails;
import com.schedulepro.employee.repository.EmployeeDetailsRepository;
import com.schedulepro.manager.dto.request.ManagerProfileRequestDTO;
import com.schedulepro.manager.dto.response.ManagerProfileResponseDTO;
import com.schedulepro.manager.dto.response.ManagerStatsDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ManagerProfileService {

    private final UserRepository userRepository;
    private final EmployeeDetailsRepository employeeDetailsRepository;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    /**
     * Get manager profile by email
     */
    public ManagerProfileResponseDTO getManagerProfile(String email) {
        log.info("Fetching manager profile for: {}", email);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        EmployeeDetails employeeDetails = employeeDetailsRepository.findByUser(user)
                .orElse(new EmployeeDetails());

        return convertToResponseDTO(user, employeeDetails);
    }

    /**
     * Update manager profile
     */
    @Transactional
    public ManagerProfileResponseDTO updateManagerProfile(String email, ManagerProfileRequestDTO request) {
        log.info("Updating manager profile for: {}", email);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Update User fields
        if (request.getFullName() != null) user.setFullName(request.getFullName());
        if (request.getPhone() != null) user.setPhone(request.getPhone());
        if (request.getDepartment() != null) user.setDepartment(request.getDepartment());
        if (request.getPosition() != null) user.setPosition(request.getPosition());
        if (request.getAddress() != null) user.setAddress(request.getAddress());

        user = userRepository.save(user);

        // Update or create EmployeeDetails
        EmployeeDetails employeeDetails = employeeDetailsRepository.findByUser(user)
                .orElse(new EmployeeDetails());

        employeeDetails.setUser(user);

        // Personal Info
        if (request.getAlternatePhone() != null)
            employeeDetails.setAlternatePhone(request.getAlternatePhone());

        if (request.getDateOfBirth() != null && !request.getDateOfBirth().isEmpty()) {
            try {
                employeeDetails.setDateOfBirth(LocalDate.parse(request.getDateOfBirth(), DATE_FORMATTER));
            } catch (Exception e) {
                log.warn("Invalid date format for dateOfBirth: {}", request.getDateOfBirth());
            }
        }

        if (request.getBloodGroup() != null)
            employeeDetails.setBloodGroup(request.getBloodGroup());

        if (request.getAddress() != null)
            employeeDetails.setAddress(request.getAddress());

        if (request.getOfficeLocation() != null)
            employeeDetails.setOfficeLocation(request.getOfficeLocation());

        if (request.getWorkEmail() != null)
            employeeDetails.setWorkEmail(request.getWorkEmail());

        // Manager-specific fields
        if (request.getTeamSize() != null)
            employeeDetails.setTeamSize(request.getTeamSize());

        if (request.getDepartmentHead() != null)
            employeeDetails.setDepartmentHead(request.getDepartmentHead());

        if (request.getManagerLevel() != null)
            employeeDetails.setManagerLevel(request.getManagerLevel());

        if (request.getReportsTo() != null)
            employeeDetails.setReportsTo(request.getReportsTo());

        if (request.getManagedDepartments() != null)
            employeeDetails.setManagedDepartments(request.getManagedDepartments());

        if (request.getEmployeeCount() != null)
            employeeDetails.setEmployeeCount(request.getEmployeeCount());

        // Emergency Contact
        if (request.getEmergencyContact() != null) {
            employeeDetails.setEmergencyContactName(request.getEmergencyContact().getName());
            employeeDetails.setEmergencyContactRelationship(request.getEmergencyContact().getRelationship());
            employeeDetails.setEmergencyContactPhone(request.getEmergencyContact().getPhone());
        }

        // Skills
        if (request.getSkills() != null)
            employeeDetails.setSkills(request.getSkills());

        // Languages
        if (request.getLanguages() != null)
            employeeDetails.setLanguages(request.getLanguages());

        // Social Links
        if (request.getSocialLinks() != null) {
            employeeDetails.setLinkedinUrl(request.getSocialLinks().getLinkedin());
            employeeDetails.setGithubUrl(request.getSocialLinks().getGithub());
            employeeDetails.setTwitterUrl(request.getSocialLinks().getTwitter());
        }

        employeeDetails = employeeDetailsRepository.save(employeeDetails);
        log.info("Manager profile updated successfully for: {}", email);

        return convertToResponseDTO(user, employeeDetails);
    }

    /**
     * Upload profile photo
     */
    @Transactional
    public String uploadProfilePhoto(String email, String photoBase64) {
        log.info("Uploading profile photo for: {}", email);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Save base64 string directly (in production, upload to cloud storage)
        user.setProfilePhoto(photoBase64);
        userRepository.save(user);

        log.info("Profile photo uploaded for: {}", email);
        return photoBase64;
    }

    /**
     * Get manager dashboard stats
     */
    public ManagerStatsDTO getManagerStats(String email) {
        log.info("Fetching manager stats for: {}", email);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Get team members using UserRepository.findByManagerId
        List<User> teamMembers = userRepository.findByManagerId(user.getId().toString());
        int teamSize = teamMembers.size();

        // Get employee details
        EmployeeDetails employeeDetails = employeeDetailsRepository.findByUser(user)
                .orElse(new EmployeeDetails());

        return ManagerStatsDTO.builder()
                .teamSize(teamSize)
                .employeeCount(employeeDetails.getEmployeeCount() != null ? employeeDetails.getEmployeeCount() : teamSize)
                .departmentHead(employeeDetails.getDepartmentHead() != null ? employeeDetails.getDepartmentHead() : false)
                .managedDepartments(employeeDetails.getManagedDepartments() != null ?
                        employeeDetails.getManagedDepartments() : new ArrayList<>())
                .build();
    }

    private ManagerProfileResponseDTO convertToResponseDTO(User user, EmployeeDetails details) {
        // Emergency Contact
        ManagerProfileResponseDTO.EmergencyContactDTO emergencyContact = null;
        if (details.getEmergencyContactName() != null ||
                details.getEmergencyContactPhone() != null) {
            emergencyContact = ManagerProfileResponseDTO.EmergencyContactDTO.builder()
                    .name(details.getEmergencyContactName())
                    .relationship(details.getEmergencyContactRelationship())
                    .phone(details.getEmergencyContactPhone())
                    .build();
        }

        // Social Links
        ManagerProfileResponseDTO.SocialLinksDTO socialLinks = null;
        if (details.getLinkedinUrl() != null ||
                details.getGithubUrl() != null ||
                details.getTwitterUrl() != null) {
            socialLinks = ManagerProfileResponseDTO.SocialLinksDTO.builder()
                    .linkedin(details.getLinkedinUrl())
                    .github(details.getGithubUrl())
                    .twitter(details.getTwitterUrl())
                    .build();
        }

        return ManagerProfileResponseDTO.builder()
                .id(user.getId().toString())
                .fullName(user.getFullName())
                .username(user.getUsername())
                .email(user.getEmail())
                .phone(user.getPhone())
                .alternatePhone(details.getAlternatePhone())
                .department(user.getDepartment())
                .position(user.getPosition())
                .profilePhoto(user.getProfilePhoto())
                .employeeId(user.getEmployeeId())
                .joinDate(user.getJoinDate())
                .dateOfBirth(details.getDateOfBirth())
                .bloodGroup(details.getBloodGroup())
                .address(details.getAddress())
                .officeLocation(details.getOfficeLocation())
                .workEmail(details.getWorkEmail())
                .isActive(user.getIsActive())
                .isVerified(user.getIsVerified())
                // ✅ FIXED: role is already a String, just use it directly
                .role(user.getRole())

                // Manager-specific
                .teamSize(details.getTeamSize())
                .departmentHead(details.getDepartmentHead())
                .managerLevel(details.getManagerLevel())
                .reportsTo(details.getReportsTo())
                .managedDepartments(details.getManagedDepartments())
                .employeeCount(details.getEmployeeCount())

                // Emergency Contact
                .emergencyContact(emergencyContact)

                // Skills & Languages
                .skills(details.getSkills())
                .languages(details.getLanguages())

                // Social Links
                .socialLinks(socialLinks)

                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}