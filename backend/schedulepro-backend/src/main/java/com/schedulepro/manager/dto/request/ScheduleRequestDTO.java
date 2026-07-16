package com.schedulepro.manager.dto.request;

import lombok.Data;

@Data
public class ScheduleRequestDTO {
    private String employeeId;
    private String employeeName;
    private String employeeEmail;
    private String date;
    private String shift;
}