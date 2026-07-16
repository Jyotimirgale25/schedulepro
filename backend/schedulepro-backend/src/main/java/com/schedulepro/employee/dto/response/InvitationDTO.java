package com.schedulepro.employee.dto.response;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class InvitationDTO {
    private String id;
    private String managerId;
    private String managerName;
    private String managerEmail;
    private String employeeEmail;
    private String employeeName;
    private String department;
    private String position;
    private String rejectionReason;
    private String status;
    private String message;
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;
    private LocalDateTime respondedAt;
}