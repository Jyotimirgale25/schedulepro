// src/main/java/com/schedulepro/admin/dto/request/UpdateUserRoleRequest.java
package com.schedulepro.admin.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateUserRoleRequest {
    @NotBlank(message = "Role is required")
    private String role;
}