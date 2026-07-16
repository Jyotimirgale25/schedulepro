package com.schedulepro.manager.dto.request;

import lombok.Data;

@Data
public class InviteRequestDTO {

    private String email;      // ✅ Required
    private String role;         // ✅ Required
    private String department;   // ✅ Required
    private String position;     // ✅ Required
    private String message;      // ✅ Optional (your frontend may not send this)
}