package com.schedulepro.employee.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ScheduleResponseDTO {
    private String id;
    private String employeeId;
    private String date;
    private String shift;
    private String status;
    private String employeeName;
}