package com.schedulepro.auth.controller;

import com.schedulepro.auth.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/test")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost")
public class TestEmailController {

    private final EmailService emailService;

    @PostMapping("/send-otp-test")
    public String sendTestOtp(@RequestParam String email) {
        emailService.sendOtpEmail(email, "123456");
        return "OTP sent to " + email;
    }
}
