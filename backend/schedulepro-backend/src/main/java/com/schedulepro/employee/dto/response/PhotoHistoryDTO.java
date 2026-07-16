// src/main/java/com/schedulepro/employee/dto/response/PhotoHistoryDTO.java
package com.schedulepro.employee.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PhotoHistoryDTO {
    private String id;  // Changed from UUID to String
    private String photo;
    private String type;
    private LocalDateTime timestamp;
}