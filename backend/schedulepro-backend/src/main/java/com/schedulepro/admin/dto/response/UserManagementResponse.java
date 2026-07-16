package com.schedulepro.admin.dto.response;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class UserManagementResponse {
    private String id;
    private String username;
    private String email;
    private String fullName;
    private String role;
    private String department;
    private String position;
    private String phone;
    private Boolean isActive;
    private LocalDateTime createdAt;
}