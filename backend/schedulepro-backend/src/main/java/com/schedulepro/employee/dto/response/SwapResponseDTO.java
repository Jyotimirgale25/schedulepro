// src/main/java/com/schedulepro/employee/dto/response/SwapResponseDTO.java
package com.schedulepro.employee.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SwapResponseDTO {
    private String id;
    private String requesterId;
    private String requesterName;
    private String requesterEmail;
    private String targetEmployeeId;
    private String targetName;
    private String targetEmail;
    private String requesterShiftDate;
    private String targetShiftDate;
    private String requesterShiftTime;
    private String targetShiftTime;
    private String requesterScheduleId;  // ✅ ADD THIS
    private String targetScheduleId;     // ✅ ADD THIS
    private String reason;
    private String requesterStatus;
    private String targetStatus;
    private String managerStatus;
    private LocalDateTime createdAt;
    private String managerComments;
}