package com.schedulepro.auth.service;

import com.schedulepro.auth.entity.User;
import com.schedulepro.auth.repository.UserRepository;
import com.schedulepro.auth.dto.request.SendOtpRequest;
import com.schedulepro.auth.dto.request.VerifyOtpRequest;
import com.schedulepro.auth.dto.response.OtpResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class OtpService {

    private final UserRepository userRepository;
    private final EmailService emailService;

    // ✅ Store OTPs in memory (for demo - use Redis in production)
    private final ConcurrentHashMap<String, OtpData> otpStore = new ConcurrentHashMap<>();

    private static final int OTP_EXPIRY_MINUTES = 5;
    private static final int OTP_LENGTH = 6;

    @Value("${app.base-url:http://localhost:8080}")
    private String baseUrl;

    // ============================================
    // SEND OTP
    // ============================================
    @Transactional
    public OtpResponse sendOtp(SendOtpRequest request) {
        String email = request.getEmail();
        log.info("📧 Sending OTP to: {}", email);

        // ✅ Validate email
        if (email == null || email.trim().isEmpty()) {
            return OtpResponse.builder()
                    .success(false)
                    .message("Email is required")
                    .build();
        }

        // ✅ Check if email already registered
        if (userRepository.findByEmail(email).isPresent()) {
            log.warn("⚠️ Email already registered: {}", email);
            return OtpResponse.builder()
                    .success(false)
                    .message("Email is already registered. Please login.")
                    .build();
        }

        // ✅ Generate OTP
        String otp = generateOtp();
        log.info("🔐 Generated OTP for {}: {}", email, otp);

        // ✅ Store OTP
        storeOtp(email, otp);

        // ✅ Send OTP via Email
        try {
            emailService.sendOtpEmail(email, otp);
            log.info("✅ OTP sent to: {}", email);
        } catch (Exception e) {
            log.error("❌ Failed to send OTP email: {}", e.getMessage());
            return OtpResponse.builder()
                    .success(false)
                    .message("Failed to send OTP. Please try again.")
                    .build();
        }

        return OtpResponse.builder()
                .success(true)
                .message("OTP sent successfully to " + email)
                .email(email)
                .otp(otp) // ✅ For testing only - remove in production!
                .expiresIn(OTP_EXPIRY_MINUTES)
                .build();
    }

    // ============================================
    // VERIFY OTP
    // ============================================
    @Transactional
    public OtpResponse verifyOtp(VerifyOtpRequest request) {
        String email = request.getEmail();
        String otp = request.getOtp();

        log.info("🔐 Verifying OTP for: {}", email);

        // ✅ Validate input
        if (email == null || otp == null) {
            return OtpResponse.builder()
                    .success(false)
                    .message("Email and OTP are required")
                    .build();
        }

        // ✅ Check if OTP exists
        OtpData storedOtp = otpStore.get(email);
        if (storedOtp == null) {
            log.warn("⚠️ No OTP found for: {}", email);
            return OtpResponse.builder()
                    .success(false)
                    .message("OTP not found. Please request a new OTP.")
                    .build();
        }

        // ✅ Check if OTP is expired
        if (storedOtp.isExpired()) {
            otpStore.remove(email);
            log.warn("⚠️ OTP expired for: {}", email);
            return OtpResponse.builder()
                    .success(false)
                    .message("OTP has expired. Please request a new OTP.")
                    .build();
        }

        // ✅ Check if OTP matches
        if (!storedOtp.getOtp().equals(otp)) {
            log.warn("⚠️ Invalid OTP for: {}", email);
            return OtpResponse.builder()
                    .success(false)
                    .message("Invalid OTP. Please try again.")
                    .build();
        }

        // ✅ OTP is valid - remove it
        otpStore.remove(email);
        log.info("✅ OTP verified successfully for: {}", email);

        return OtpResponse.builder()
                .success(true)
                .message("OTP verified successfully")
                .email(email)
                .build();
    }

    // ============================================
    // RESEND OTP
    // ============================================
    @Transactional
    public OtpResponse resendOtp(String email) {
        log.info("📧 Resending OTP to: {}", email);

        // ✅ Validate email
        if (email == null || email.trim().isEmpty()) {
            return OtpResponse.builder()
                    .success(false)
                    .message("Email is required")
                    .build();
        }

        // ✅ Check if email already registered
        if (userRepository.findByEmail(email).isPresent()) {
            log.warn("⚠️ Email already registered: {}", email);
            return OtpResponse.builder()
                    .success(false)
                    .message("Email is already registered. Please login.")
                    .build();
        }

        // ✅ Generate new OTP
        String otp = generateOtp();
        log.info("🔐 Generated new OTP for {}: {}", email, otp);

        // ✅ Store OTP
        storeOtp(email, otp);

        // ✅ Send OTP via Email
        try {
            emailService.sendOtpEmail(email, otp);
            log.info("✅ OTP resent to: {}", email);
        } catch (Exception e) {
            log.error("❌ Failed to resend OTP: {}", e.getMessage());
            return OtpResponse.builder()
                    .success(false)
                    .message("Failed to resend OTP. Please try again.")
                    .build();
        }

        return OtpResponse.builder()
                .success(true)
                .message("OTP resent successfully to " + email)
                .email(email)
                .otp(otp) // ✅ For testing only - remove in production!
                .expiresIn(OTP_EXPIRY_MINUTES)
                .build();
    }

    // ============================================
    // GENERATE OTP
    // ============================================
    private String generateOtp() {
        Random random = new Random();
        StringBuilder otp = new StringBuilder();
        for (int i = 0; i < OTP_LENGTH; i++) {
            otp.append(random.nextInt(10));
        }
        return otp.toString();
    }

    // ============================================
    // STORE OTP
    // ============================================
    private void storeOtp(String email, String otp) {
        otpStore.put(email, new OtpData(otp, LocalDateTime.now().plusMinutes(OTP_EXPIRY_MINUTES)));
        log.info("✅ OTP stored for: {}", email);
    }

    // ============================================
    // VALIDATE OTP (For password reset, etc.)
    // ============================================
    public boolean validateOtp(String email, String otp) {
        OtpData storedOtp = otpStore.get(email);
        if (storedOtp == null || storedOtp.isExpired()) {
            otpStore.remove(email);
            return false;
        }
        return storedOtp.getOtp().equals(otp);
    }

    // ============================================
    // INNER CLASS - OTP Data
    // ============================================
    private static class OtpData {
        private final String otp;
        private final LocalDateTime expiryTime;

        public OtpData(String otp, LocalDateTime expiryTime) {
            this.otp = otp;
            this.expiryTime = expiryTime;
        }

        public String getOtp() {
            return otp;
        }

        public boolean isExpired() {
            return LocalDateTime.now().isAfter(expiryTime);
        }
    }

    // ============================================
    // GENERATE AND SEND OTP (For Forgot Password)
    // ============================================
    public String generateAndSendOTP(String email) {
        String otp = generateOtp();
        storeOtp(email, otp);
        emailService.sendOtpEmail(email, otp);
        log.info("📧 Password reset OTP sent to: {}", email);
        return otp;
    }

    // ============================================
    // VERIFY OTP (Simple boolean)
    // ============================================
    public boolean verifyOTP(String email, String otp) {
        return validateOtp(email, otp);
    }
}