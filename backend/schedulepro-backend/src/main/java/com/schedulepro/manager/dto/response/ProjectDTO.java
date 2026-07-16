// src/main/java/com/schedulepro/manager/dto/response/ProjectDTO.java
package com.schedulepro.manager.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectDTO {
    private String id;
    private String name;
    private String description;
    private String startDate;  // ✅ String for JSON serialization
    private String endDate;    // ✅ String for JSON serialization
    private String priority;
    private String status;
    private Integer progress;
    private String createdBy;
    private String createdAt;
}