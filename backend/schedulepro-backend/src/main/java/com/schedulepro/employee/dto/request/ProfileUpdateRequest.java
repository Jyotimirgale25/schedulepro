package com.schedulepro.employee.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
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
public class ProfileUpdateRequest {

    @NotBlank(message = "Full name is required")
    private String fullName;

    @Email(message = "Invalid email format")
    @NotBlank(message = "Email is required")
    private String email;

    @Pattern(regexp = "^\\+?[0-9]{10,15}$", message = "Invalid phone number")
    private String phone;

    private String alternatePhone;

    private EmergencyContactDTO emergencyContact;

    private String department;
    private String position;
    private LocalDate dateOfBirth;
    private String bloodGroup;
    private String address;
    private List<String> skills;
    private List<String> languages;
    private SocialLinksDTO socialLinks;

    // ✅ ADD THIS - but photo is uploaded separately
    // private String profilePhoto;  // Not needed here - photo has separate endpoint

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