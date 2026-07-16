// src/main/java/com/schedulepro/admin/dto/response/AdminLeaveResponseDTO.java
package com.schedulepro.admin.dto.response;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class AdminLeaveResponseDTO {
    private String id;
    private String userId;
    private String userFullName;
    private String userEmail;
    private String userDepartment;
    private String userPosition;
    private String leaveType;
    private LocalDate startDate;
    private LocalDate endDate;
    private String reason;
    private String status;
    private Double totalDays;
    private String approvedBy;
    private String approvedByName;
    private String approvedByEmail;  // Add this field
    private String approvalComments;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}