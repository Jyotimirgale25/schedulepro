package com.schedulepro.employee.dto.request;

import lombok.Data;

@Data
public class SwapRequestDTO {
    private String targetEmployeeId;
    private String requesterScheduleId;
    private String targetScheduleId;
    private String requesterShiftDate;
    private String targetShiftDate;
    private String requesterShiftTime;
    private String targetShiftTime;
    private String reason;
}