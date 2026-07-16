// src/main/java/com/schedulepro/admin/dto/response/AdminSwapResponseDTO.java
package com.schedulepro.admin.dto.response;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class AdminSwapResponseDTO {
    private String id;
    private String requesterId;
    private String requesterName;
    private String requesterEmail;
    private String targetId;
    private String targetName;
    private String targetEmail;
    private LocalDate requesterShiftDate;
    private LocalDate targetShiftDate;
    private String requesterShiftTime;
    private String targetShiftTime;
    private String reason;
    private String requesterStatus;
    private String targetStatus;
    private String managerStatus;
    private String overallStatus;
    private String approvedBy;
    private String approvedByName;
    private String managerComments;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}