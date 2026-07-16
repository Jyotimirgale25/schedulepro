package com.schedulepro.employee.dto.response;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class LeaveResponseDTO {
    private String id;
    private String leaveType;
    private LocalDate startDate;
    private LocalDate endDate;
    private String reason;
    private String status;
    private Double totalDays;
    private LocalDateTime createdAt;
    private String approvedBy;
}