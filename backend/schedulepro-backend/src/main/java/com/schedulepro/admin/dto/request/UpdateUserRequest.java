// src/main/java/com/schedulepro/admin/dto/request/UpdateUserRequest.java
package com.schedulepro.admin.dto.request;

import jakarta.validation.constraints.Email;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateUserRequest {
    private String fullName;

    @Email(message = "Invalid email format")
    private String email;

    private String phone;
    private String department;
    private String position;
    private String role;
    private Boolean isActive;
}