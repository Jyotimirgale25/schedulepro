package com.schedulepro.employee.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class LeaveBalanceResponseDTO {
    private Integer casualLeaves;
    private Integer sickLeaves;
    private Integer annualLeaves;
    private Integer emergencyLeaves;
}