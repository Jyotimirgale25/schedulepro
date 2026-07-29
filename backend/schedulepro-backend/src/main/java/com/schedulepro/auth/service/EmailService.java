package com.schedulepro.auth.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;
    @Value("${spring.mail.username}")
    private String fromEmail;
    public void sendOtpEmail(String toEmail, String otp) {
        // ✅ Run email sending in background thread
        new Thread(() -> {
            try {
                log.info("📧 Sending OTP email to: {}", toEmail);

                SimpleMailMessage message = new SimpleMailMessage();
                message.setFrom(fromEmail);
                message.setTo(toEmail);
                message.setSubject("🔐 Schedule Pro - Your OTP Code");
                message.setText("Your OTP code is: " + otp + "\n\nThis OTP is valid for 5 minutes.");
                mailSender.send(message);
                log.info("✅ OTP email sent successfully to: {}", toEmail);

            } catch (Exception e) {
                log.error("❌ Failed to send OTP email to: {}", toEmail, e);
            }
        }).start();

        // ✅ Return immediately without waiting for email
        log.info("📧 Email sending started in background for: {}", toEmail);
    }
}