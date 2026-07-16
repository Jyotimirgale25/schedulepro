// src/main/java/com/schedulepro/admin/dto/response/ProfileResponseDTO.java
package com.schedulepro.admin.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
@Builder
public class ProfileResponseDTO {
    private String id;
    private String fullName;
    private String email;
    private String username;
    private String phone;
    private String alternatePhone;
    private String department;
    private String position;
    private String employeeId;
    private String joinDate;
    private String bloodGroup;
    private String dateOfBirth;
    private String address;
    private String profilePhoto;
    private List<String> skills;
    private List<String> languages;
    private EmergencyContactDTO emergencyContact;
    private SocialLinksDTO socialLinks;
    private String role;
    private Boolean isActive;
    private Boolean isVerified;

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