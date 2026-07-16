// src/main/java/com/schedulepro/admin/dto/request/UpdateDepartmentRequest.java
package com.schedulepro.admin.dto.request;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateDepartmentRequest {
    @Size(max = 100, message = "Department name must be less than 100 characters")
    private String name;

    @Size(max = 500, message = "Description must be less than 500 characters")
    private String description;

    private String head;
    private Boolean isActive;
}