package com.schedulepro.manager.dto.request;

import lombok.Data;

@Data
public class LeaveApprovalRequest {
    private String status;
    private String remarks;
}