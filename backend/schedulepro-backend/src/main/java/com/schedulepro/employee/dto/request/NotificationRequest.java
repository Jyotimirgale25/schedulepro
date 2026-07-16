package com.schedulepro.employee.dto.request;

import lombok.Data;

@Data
public class NotificationRequest {
    private String userEmail;
    private String title;
    private String message;
    private String type;
}