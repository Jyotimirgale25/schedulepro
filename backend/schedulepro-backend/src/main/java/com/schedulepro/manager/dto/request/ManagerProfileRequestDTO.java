// src/main/java/com/schedulepro/manager/dto/request/ManagerProfileRequestDTO.java
package com.schedulepro.manager.dto.request;

import lombok.Data;
import java.util.List;

@Data
public class ManagerProfileRequestDTO {
    private String fullName;
    private String email;
    private String phone;
    private String alternatePhone;
    private String department;
    private String position;
    private String dateOfBirth;
    private String bloodGroup;
    private String address;
    private String officeLocation;
    private String workEmail;
    private String employeeId;
    private String joinDate;

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

    @Data
    public static class EmergencyContactDTO {
        private String name;
        private String relationship;
        private String phone;
    }

    @Data
    public static class SocialLinksDTO {
        private String linkedin;
        private String github;
        private String twitter;
    }
}