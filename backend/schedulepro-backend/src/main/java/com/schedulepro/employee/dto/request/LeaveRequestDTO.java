package com.schedulepro.employee.dto.request;

import lombok.Data;
import java.time.LocalDate;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class LeaveRequestDTO {
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
    private String approvalComments;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}