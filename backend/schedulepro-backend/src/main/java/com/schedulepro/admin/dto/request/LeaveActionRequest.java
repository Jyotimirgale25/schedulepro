// src/main/java/com/schedulepro/admin/dto/request/LeaveActionRequest.java
package com.schedulepro.admin.dto.request;

import lombok.Data;

@Data
public class LeaveActionRequest {
    private String status;
    private String approvalComments;
}