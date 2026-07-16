// src/main/java/com/schedulepro/admin/dto/request/UpdateScheduleRequest.java
package com.schedulepro.admin.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateScheduleRequest {
    private String employeeId;
    private String employeeName;
    private String employeeEmail;
    private String date;
    private String shift;
    private String status;
}