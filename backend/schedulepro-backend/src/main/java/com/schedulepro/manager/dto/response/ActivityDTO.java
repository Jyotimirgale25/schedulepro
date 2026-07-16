package com.schedulepro.manager.dto.response;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class ActivityDTO {
    private String id;
    private String type;       // leave, swap, task, schedule, project
    private String title;
    private String action;
    private String details;
    private String status;
    private String icon;
    private LocalDateTime date;
    private String employeeName;
    private String employeeEmail;
}