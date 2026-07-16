// src/main/java/com/schedulepro/admin/dto/response/ScheduleDTO.java
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
public class ScheduleDTO {
    private String id;
    private String employeeId;
    private String employeeName;
    private String employeeEmail;
    private String date;
    private String shift;
    private String status;
    private String createdBy;
    private LocalDateTime createdAt;
    // ❌ REMOVED: private LocalDateTime updatedAt;
}