// src/main/java/com/schedulepro/employee/dto/response/ProfileResponseDTO.java
package com.schedulepro.employee.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProfileResponseDTO {
    private String fullName;
    private String email;
    private String phone;
    private String alternatePhone;
    private String profilePhoto;
    private EmergencyContactDTO emergencyContact;
    private String department;
    private String position;
    private String employeeId;
    private LocalDate joinDate;
    private String bloodGroup;
    private LocalDate dateOfBirth;
    private String address;
    private List<String> skills;
    private List<String> languages;
    private SocialLinksDTO socialLinks;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EmergencyContactDTO {
        private String name;
        private String relationship;
        private String phone;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SocialLinksDTO {
        private String linkedin;
        private String github;
        private String twitter;
    }
}