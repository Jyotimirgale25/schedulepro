// src/main/java/com/schedulepro/admin/dto/response/ReportResponseDTO.java
package com.schedulepro.admin.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class ReportResponseDTO {
    private ReportOverviewDTO overview;
    private ReportTasksDTO tasks;
    private List<ReportUserDTO> users;
}