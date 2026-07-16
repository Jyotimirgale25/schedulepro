package com.schedulepro.auth.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class LoginResponse {
    private String accessToken;
    private String tokenType = "Bearer";
    private UserInfo user;  // Nested user object

    @Data
    @Builder
    public static class UserInfo {
        private String id;
        private String email;
        private String username;
        private String fullName;
        private String role;
        private String phone;
        private String profilePhoto;      // ✅ ADD THIS
        private String department;        // ✅ ADD THIS
        private String position;          // ✅ ADD THIS
        private String employeeId;        // ✅ ADD THIS
        private String provider;

    }
}