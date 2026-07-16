// src/main/java/com/schedulepro/admin/dto/response/AdminUserDTO.java
package com.schedulepro.admin.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserDTO {
    private String id;
    private String fullName;
    private String email;
    private String username;
    private String phone;
    private String role;
    private String department;
    private String position;
    private Boolean isActive;
    private Boolean isVerified;
    private String profilePhoto;
    private String managerId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}