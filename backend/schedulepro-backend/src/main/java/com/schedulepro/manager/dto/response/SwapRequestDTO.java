package com.schedulepro.manager.dto.response;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class SwapRequestDTO {
    private String id;
    private String requesterId;
    private String requesterName;
    private String targetEmployeeId;
    private String targetEmployeeName;
    private LocalDate requesterShiftDate;
    private LocalDate targetShiftDate;
    private String requesterShift;
    private String targetShift;
    private String reason;
    private String status;
    private LocalDateTime createdAt;
}