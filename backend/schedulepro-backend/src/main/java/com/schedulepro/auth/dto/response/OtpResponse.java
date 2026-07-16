package com.schedulepro.auth.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class OtpResponse {
    private boolean success;
    private String message;
    private String otp;  // ← ADD THIS FIELD
    private String email;
    private LoginResponse.UserInfo user;
}