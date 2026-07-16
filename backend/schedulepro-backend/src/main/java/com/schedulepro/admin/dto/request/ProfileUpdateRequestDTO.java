// src/main/java/com/schedulepro/admin/dto/request/ProfileUpdateRequestDTO.java
package com.schedulepro.admin.dto.request;

import lombok.Data;

import java.util.List;

@Data
public class ProfileUpdateRequestDTO {
    private String fullName;
    private String phone;
    private String alternatePhone;
    private String department;
    private String position;
    private String bloodGroup;
    private String dateOfBirth;
    private String address;
    private List<String> skills;
    private List<String> languages;
    private EmergencyContactDTO emergencyContact;
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