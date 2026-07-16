// src/main/java/com/schedulepro/admin/dto/request/CreateScheduleRequest.java
package com.schedulepro.admin.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateScheduleRequest {
    @NotBlank(message = "Employee ID is required")
    private String employeeId;

    private String employeeName;
    private String employeeEmail;

    @NotBlank(message = "Date is required")
    private String date;

    @NotBlank(message = "Shift is required")
    private String shift;

    private String status = "SCHEDULED";
}