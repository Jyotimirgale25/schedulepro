package com.schedulepro.manager.dto.response;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDate;

@Data
@Builder
public class LeaveRequestDTO {
    private String id;
    private String userFullName;
    private String userEmail;
    private String userId;
    private String leaveType;
    private LocalDate startDate;
    private LocalDate endDate;
    private String reason;
    private Double totalDays;
    private String status;
}