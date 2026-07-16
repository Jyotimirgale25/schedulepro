// src/main/java/com/schedulepro/manager/dto/response/ManagerProfileResponseDTO.java
package com.schedulepro.manager.dto.response;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class ManagerProfileResponseDTO {
    private String id;
    private String fullName;
    private String username;
    private String email;
    private String phone;
    private String alternatePhone;
    private String department;
    private String position;
    private String profilePhoto;
    private String employeeId;
    private LocalDate joinDate;
    private LocalDate dateOfBirth;
    private String bloodGroup;
    private String address;
    private String officeLocation;
    private String workEmail;
    private Boolean isActive;
    private Boolean isVerified;
    private String role;

    // Manager-specific fields
    private Integer teamSize;
    private Boolean departmentHead;
    private String managerLevel;
    private String reportsTo;
    private List<String> managedDepartments;
    private Integer employeeCount;

    // Emergency Contact
    private EmergencyContactDTO emergencyContact;

    // Skills & Languages
    private List<String> skills;
    private List<String> languages;

    // Social Links
    private SocialLinksDTO socialLinks;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Data
    @Builder
    public static class EmergencyContactDTO {
        private String name;
        private String relationship;
        private String phone;
    }

    @Data
    @Builder
    public static class SocialLinksDTO {
        private String linkedin;
        private String github;
        private String twitter;
    }
}