package com.schedulepro.auth.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    public void sendOtpEmail(String toEmail, String otp) {
        try {
            log.info("📧 Sending OTP email to: {}", toEmail);

            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(toEmail);
            message.setSubject("🔐 Schedule Pro - Your OTP Code");
            message.setText(String.format(
                    "Hello,\n\n" +
                            "Your OTP code for Schedule Pro registration is: %s\n\n" +
                            "This code is valid for 5 minutes.\n\n" +
                            "If you didn't request this, please ignore this email.\n\n" +
                            "Best regards,\n" +
                            "Schedule Pro Team",
                    otp
            ));

            mailSender.send(message);
            log.info("✅ OTP email sent successfully to: {}", toEmail);

        } catch (Exception e) {
            log.error("❌ Failed to send OTP email to: {}", toEmail, e);
            // ✅ Don't throw exception - let AuthService handle the fallback
            // The OTP is already printed in AuthService console
        }
    }
}