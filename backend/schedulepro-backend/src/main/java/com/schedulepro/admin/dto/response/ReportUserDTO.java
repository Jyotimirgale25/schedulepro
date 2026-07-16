// src/main/java/com/schedulepro/admin/dto/response/ReportUserDTO.java
package com.schedulepro.admin.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportUserDTO {
    private String id;
    private String name;
    private String email;
    private String role;
    private long tasksAssigned;
    private long tasksCompleted;
    private long leavesTaken;
    private double performance;
}